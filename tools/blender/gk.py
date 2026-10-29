# 叙事管理局 · 哥特构件库（Blender 4.3 headless，纯 bmesh 程序化建模）
# 坐标：Blender Z 向上。游戏坐标 (x, y, z) = Blender (x, -z, y)，即 Blender y = -游戏 z。
# 所有尺寸单位：米。UV0 由 box_uv() 按世界坐标（米制 / 贴图实际尺寸）生成；UV1（光照贴图）由 bake.py 统一展开。
import bpy, bmesh, math, random
from mathutils import Vector, Matrix

TAU = math.pi * 2

# ---------------------------------------------------------------- 网格累加器
class Acc:
    """按材质累加几何（顶点列表 + 面列表 + 每面 smooth 标记），最后一次性生成对象"""
    def __init__(self):
        self.d = {}
    def add(self, mat, verts, faces, M=None, smooth=False):
        e = self.d.setdefault(mat, [[], [], []])
        base = len(e[0])
        if M is not None:
            verts = [M @ Vector(v) for v in verts]
        e[0].extend(Vector(v) for v in verts)
        e[1].extend(tuple(i + base for i in f) for f in faces)
        e[2].extend([smooth] * len(faces))
    def merge(self, other, M=None):
        for mat, (v, f, s) in other.d.items():
            e = self.d.setdefault(mat, [[], [], []]); base = len(e[0])
            e[0].extend((M @ x) if M is not None else x.copy() for x in v)
            e[1].extend(tuple(i + base for i in ff) for ff in f); e[2].extend(s)
    def tris(self):
        n = 0
        for v, f, s in self.d.values():
            for ff in f: n += len(ff) - 2
        return n
    def build(self, prefix, coll=None, uvscale=None):
        objs = []
        for mat, (v, f, s) in self.d.items():
            if not f: continue
            me = bpy.data.meshes.new(prefix + '_' + mat)
            me.from_pydata([tuple(x) for x in v], [], f)
            me.validate(clean_customdata=False)
            for i, p in enumerate(me.polygons):
                if i < len(s): p.use_smooth = s[i]
            ob = bpy.data.objects.new(prefix + '_' + mat, me)
            (coll or bpy.context.scene.collection).objects.link(ob)
            m = bpy.data.materials.get(mat) or bpy.data.materials.new(mat)
            me.materials.append(m)
            box_uv(me, (uvscale or {}).get(mat, 1.0))
            objs.append(ob)
        return objs

def T(x=0, y=0, z=0):
    return Matrix.Translation((x, y, z))
def RZ(a):
    return Matrix.Rotation(a, 4, 'Z')
def RX(a):
    return Matrix.Rotation(a, 4, 'X')
def RY(a):
    return Matrix.Rotation(a, 4, 'Y')
def S(x, y=None, z=None):
    y = x if y is None else y; z = x if z is None else z
    return Matrix.Diagonal((x, y, z, 1))

# ---------------------------------------------------------------- UV：盒投影（世界米制）
def box_uv(me, scale=1.0):
    """竖直面：u = 水平坐标，v = z（石块层缝保持水平）；水平面：u=x, v=y。scale = 1/贴图覆盖米数"""
    if not me.uv_layers: me.uv_layers.new(name='UVMap')
    uv = me.uv_layers[0].data
    vs = me.vertices
    for p in me.polygons:
        n = p.normal
        ax, ay, az = abs(n.x), abs(n.y), abs(n.z)
        for li in p.loop_indices:
            co = vs[me.loops[li].vertex_index].co
            if az >= ax and az >= ay: u, v = co.x, co.y
            elif ax >= ay: u, v = co.y * (1 if n.x > 0 else -1), co.z
            else: u, v = co.x * (-1 if n.y > 0 else 1), co.z
            uv[li].uv = (u * scale, v * scale)

# ---------------------------------------------------------------- 基本体
def box(sx, sy, sz):
    hx, hy, hz = sx / 2, sy / 2, sz / 2
    v = [(-hx, -hy, -hz), (hx, -hy, -hz), (hx, hy, -hz), (-hx, hy, -hz), (-hx, -hy, hz), (hx, -hy, hz), (hx, hy, hz), (-hx, hy, hz)]
    f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    return v, f

def cbox(sx, sy, sz, c=0.03):
    """倒角长方体（45° 倒角，所有棱）——石材构件的基本形，棱线能接住高光"""
    c = min(c, sx * 0.45, sy * 0.45, sz * 0.45)
    hx, hy, hz = sx / 2, sy / 2, sz / 2
    pts = []
    for X in (-1, 1):
        for Y in (-1, 1):
            for Z in (-1, 1):
                pts += [(X * hx, Y * (hy - c), Z * (hz - c)), (X * (hx - c), Y * hy, Z * (hz - c)), (X * (hx - c), Y * (hy - c), Z * hz)]
    return hull(pts)

def hull(pts):
    bm = bmesh.new()
    for p in pts: bm.verts.new(p)
    r = bmesh.ops.convex_hull(bm, input=bm.verts)
    for g in r.get('geom_interior', []):
        if isinstance(g, bmesh.types.BMVert):
            try: bm.verts.remove(g)
            except Exception: pass
    bmesh.ops.dissolve_limit(bm, angle_limit=0.001, verts=bm.verts, edges=bm.edges)
    bm.verts.ensure_lookup_table(); bm.verts.index_update()
    v = [tuple(x.co) for x in bm.verts]; f = [tuple(x.index for x in fc.verts) for fc in bm.faces]
    bm.free(); return v, f

def prism(poly, depth, y0=0.0):
    """二维多边形（x,z）沿 +y 拉伸 depth（立面构件：x 横向，z 竖向，y 进深）"""
    n = len(poly)
    v = [(x, y0, z) for x, z in poly] + [(x, y0 + depth, z) for x, z in poly]
    f = [tuple(range(n))[::-1] if signed_area(poly) < 0 else tuple(range(n)), ]
    # 统一：front(y0) 面法线朝 -y
    fr = list(range(n)); bk = list(range(n, 2 * n))
    ccw = signed_area(poly) > 0
    if ccw: f = [tuple(fr), tuple(bk[::-1])]
    else: f = [tuple(fr[::-1]), tuple(bk)]
    for i in range(n):
        j = (i + 1) % n
        f.append((j, i, n + i, n + j) if ccw else (i, j, n + j, n + i))
    return v, f

def signed_area(p):
    return 0.5 * sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p)))

def revolve(prof, seg=16, a0=0.0, a1=TAU, close_top=True, close_bot=True):
    """旋转体：prof = [(r, z), ...] 自下而上"""
    full = abs(a1 - a0 - TAU) < 1e-6
    ns = seg if full else seg + 1
    v = []
    for i in range(ns):
        a = a0 + (a1 - a0) * i / seg
        ca, sa = math.cos(a), math.sin(a)
        for r, z in prof: v.append((r * ca, r * sa, z))
    m = len(prof); f = []
    for i in range(seg):
        i2 = (i + 1) % ns if full else i + 1
        for k in range(m - 1):
            a, b, c, d = i * m + k, i2 * m + k, i2 * m + k + 1, i * m + k + 1
            f.append((a, b, c, d))
    if full:
        if close_bot and prof[0][0] > 1e-5:
            c0 = len(v); v.append((0, 0, prof[0][1]))
            for i in range(seg): f.append((c0, ((i + 1) % ns) * m, i * m))
        if close_top and prof[-1][0] > 1e-5:
            c1 = len(v); v.append((0, 0, prof[-1][1]))
            for i in range(seg): f.append((c1, i * m + m - 1, ((i + 1) % ns) * m + m - 1))
    return v, f

def cyl(r, h, seg=12, r2=None):
    return revolve([(r, 0), (r2 if r2 is not None else r, h)], seg)

def ngon_prism(r, h, n=8, rot=0.0):
    """正 n 边柱（八角柱、八角尖塔基座）"""
    return revolve([(r, 0), (r, h)], n, rot, rot + TAU)

# ---------------------------------------------------------------- 扫掠（线脚）
def sweep(profile, path, closed=False, up=(0, 0, 1), cap=True, twist_free=True):
    """profile: [(x, y)] 截面点（x 为路径法向外侧，y 为副法线），path: [Vector]。平行移动标架。"""
    P = [Vector(p) for p in path]
    n = len(P)
    if n < 2: return [], []
    T_ = []
    for i in range(n):
        if closed: t = (P[(i + 1) % n] - P[(i - 1) % n])
        elif i == 0: t = P[1] - P[0]
        elif i == n - 1: t = P[-1] - P[-2]
        else: t = (P[i + 1] - P[i]).normalized() + (P[i] - P[i - 1]).normalized()
        T_.append(t.normalized())
    U = Vector(up)
    N0 = U - T_[0] * U.dot(T_[0])
    if N0.length < 1e-6:
        N0 = Vector((1, 0, 0)) - T_[0] * T_[0].x
    N0.normalize()
    Ns = [N0]
    for i in range(1, n):
        # 平行移动
        nprev = Ns[-1]
        nn = nprev - T_[i] * nprev.dot(T_[i])
        if nn.length < 1e-8: nn = nprev
        Ns.append(nn.normalized())
    v = []; m = len(profile)
    for i in range(n):
        Nn = Ns[i]; B = T_[i].cross(Nn)
        # 拐角处截面放大（斜接）
        sc = 1.0
        if 0 < i < n - 1 or closed:
            a = P[(i + 1) % n] - P[i]; b = P[i] - P[(i - 1) % n]
            if a.length > 1e-8 and b.length > 1e-8:
                cosang = max(-0.99, min(1.0, a.normalized().dot(b.normalized())))
                sc = 1.0 / max(0.35, math.cos(math.acos(cosang) / 2))
        for px, py in profile:
            v.append(P[i] + Nn * (px * sc) + B * py)
    f = []
    segs = n if closed else n - 1
    for i in range(segs):
        i2 = (i + 1) % n
        for k in range(m):
            k2 = (k + 1) % m
            f.append((i * m + k, i * m + k2, i2 * m + k2, i2 * m + k))
    if cap and not closed and m >= 3:
        f.append(tuple(range(m))[::-1]); f.append(tuple((n - 1) * m + k for k in range(m)))
    return v, f

def rect_prof(w, h, c=0.0, ox=0.0, oy=0.0):
    """矩形（可倒角）截面，中心 (ox, oy)"""
    if c <= 0: return [(ox - w / 2, oy - h / 2), (ox + w / 2, oy - h / 2), (ox + w / 2, oy + h / 2), (ox - w / 2, oy + h / 2)]
    hw, hh = w / 2, h / 2
    return [(ox - hw + c, oy - hh), (ox + hw - c, oy - hh), (ox + hw, oy - hh + c), (ox + hw, oy + hh - c), (ox + hw - c, oy + hh), (ox - hw + c, oy + hh), (ox - hw, oy + hh - c), (ox - hw, oy - hh + c)]

def circ_prof(r, n=8, ox=0.0, oy=0.0):
    return [(ox + r * math.cos(TAU * i / n), oy + r * math.sin(TAU * i / n)) for i in range(n)]

def roll_prof(r, w):
    """券面线脚：圆棍（roll）+ 两侧凹槽（hollow）+ 外侧平带——哥特拱券线脚的经典断面。
    截面坐标：x = 朝券外（离开开口）方向，y = 朝外立面方向（深度）。返回闭合多边形。"""
    pts = []
    # 底边平带
    pts.append((-w / 2, -r * 1.6)); pts.append((w / 2, -r * 1.6))
    pts.append((w / 2, r * 0.2))
    # 外侧凹槽
    for i in range(3):
        a = math.pi * (0.5 + i / 4)
        pts.append((w / 2 - r * 0.5 + r * 0.5 * math.cos(a) * -1, r * 0.2 + r * 0.5 * math.sin(a)))
    # 圆棍
    for i in range(6):
        a = math.pi * (i / 5)
        pts.append((r * math.cos(a), r * 0.9 + r * math.sin(a)))
    for i in range(3):
        a = math.pi * (0.5 + i / 4)
        pts.append((-w / 2 + r * 0.5 + r * 0.5 * math.cos(a), r * 0.2 + r * 0.5 * math.sin(a)))
    pts.append((-w / 2, r * 0.2))
    return pts

def cornice_prof(h, d):
    """檐口线脚截面（x=外挑，y=高）：自下：小圆线 + 凹弧（cavetto）+ 冠顶平盖 + 斜水（weathering）"""
    p = [(0, 0), (d * 0.12, 0), (d * 0.14, h * 0.06), (d * 0.1, h * 0.12)]
    for i in range(7):
        t = i / 6; a = math.pi / 2 * t
        p.append((d * 0.1 + d * 0.75 * (1 - math.cos(a)), h * 0.12 + h * 0.55 * math.sin(a)))
    p += [(d, h * 0.7), (d, h * 0.86), (d * 0.85, h * 0.86), (0, h)]
    return p

# ---------------------------------------------------------------- 尖拱几何
def pointed_arch(w, k=1.0, n=14, x0=0.0, z0=0.0):
    """尖拱（2D：x 横向, z 竖向）：两段圆弧，半径 = k*w（k=1 为等边尖拱）。返回自左拱脚到右拱脚的点列（不含拱脚以下）。"""
    R = k * w
    cxL, cxR = x0 + w / 2 - R, x0 - w / 2 + R  # 左弧圆心在右侧
    # 左弧：圆心 cxR，从左拱脚 (x0-w/2, z0) 到拱顶
    apex_x = x0
    ang_top = math.acos(max(-1, min(1, (apex_x - cxR) / R)))
    pts = []
    for i in range(n + 1):
        a = math.pi - (math.pi - ang_top) * i / n
        pts.append((cxR + R * math.cos(a), z0 + R * math.sin(a)))
    right = []
    for i in range(n - 1, -1, -1):
        x, z = pts[i]
        right.append((2 * x0 - x, z))
    return pts + right

def arch_apex(w, k=1.0):
    R = k * w
    return math.sqrt(max(0.0, R * R - (R - w / 2) ** 2))

def opening_poly(w, h_spring, k=1.0, n=14, x0=0.0, z0=0.0):
    """尖拱洞口（矩形下部 + 尖拱头）闭合多边形，逆时针"""
    a = pointed_arch(w, k, n, x0, z0 + h_spring)
    return [(x0 - w / 2, z0), (x0 + w / 2, z0)] + a[::-1][:-1] + [a[0]][:0] if False else [(x0 - w / 2, z0), (x0 + w / 2, z0)] + list(reversed(a))

def to3(pts2, y=0.0):
    """立面 2D (x, z) → 3D (x, y, z)"""
    return [Vector((x, y, z)) for x, z in pts2]

def trefoil_arch(w, hz, n=10):
    """三叶尖券（窗棂小券头，带尖瓣 cusps）：在 pointed_arch 上叠两个内凸瓣。返回闭合点列"""
    base = pointed_arch(w, 1.0, n, 0, hz)
    return base

def circle2(r, n=24, cx=0.0, cz=0.0, a0=0.0):
    return [(cx + r * math.cos(a0 + TAU * i / n), cz + r * math.sin(a0 + TAU * i / n)) for i in range(n)]

def foil(r, lobes=4, n=64, cx=0.0, cz=0.0, a0=0.0, depth=0.32):
    """多叶形（四叶/三叶/六叶）：圆周 + 余弦起伏，生成尖瓣 cusps 的观感"""
    pts = []
    for i in range(n):
        a = TAU * i / n
        rr = r * (1 - depth * (0.5 - 0.5 * math.cos(lobes * (a - a0))) ** 0.6)
        pts.append((cx + rr * math.cos(a), cz + rr * math.sin(a)))
    return pts

# ---------------------------------------------------------------- 窗花格（tracery）
def tracery_window(A, mat_stone, mat_glass, w, hs, depth=0.6, lights=2, M=Matrix(), orders=2, bar=0.14, glass_y=0.35, rose=True, mat_lead=None, lod=0):
    """哥特尖窗：外圈退缩线脚（splay 多重券）+ 竖棂 + 小尖券 + 头部圆窗（四叶/六叶）+ 玻璃。
    窗面在局部 y=0（外立面），向 +y 为室内。w=洞口宽，hs=拱脚高。"""
    apex = hs + arch_apex(w)
    # 外圈券线脚（多重退缩）
    for o in range(orders):
        ww = w + (orders - o) * 0.26
        a = pointed_arch(ww, 1.0, 11, 0, hs)
        path = [Vector((-ww / 2, -0.05 - o * 0.0, 0))] + to3(a) + [Vector((ww / 2, 0, 0))]
        path[0] = Vector((-ww / 2, 0, 0))
        prof = [(px * 0.6, py) for px, py in roll_prof(0.07, 0.24)] if lod == 0 else rect_prof(0.2, 0.18)
        v, f = sweep([(x, -(y) + o * 0.13 + 0.02) for x, y in prof], path, up=(0, -1, 0))
        A.add(mat_stone, v, f, M, smooth=True)
    # 窗台斜水
    v, f = prism([(-w / 2 - 0.35, -0.12), (w / 2 + 0.35, -0.12), (w / 2 + 0.35, 0.02), (-w / 2 - 0.35, 0.02)], depth + 0.25, -0.25)
    A.add(mat_stone, v, f, M)
    # 竖棂
    xs = [-w / 2 + w * i / lights for i in range(1, lights)]
    sub_w = w / lights
    for x in xs:
        v, f = sweep(rect_prof(bar, 0.28), [Vector((x, glass_y - 0.1, 0)), Vector((x, glass_y - 0.1, hs + 0.02))], up=(0, -1, 0))
        A.add(mat_stone, v, f, M)
    # 每格小尖券（三叶）
    for i in range(lights):
        cx = -w / 2 + sub_w * (i + 0.5)
        a = pointed_arch(sub_w, 1.0, 8, cx, hs)
        v, f = sweep(rect_prof(bar * 0.9, 0.24), to3(a, glass_y - 0.1), up=(0, -1, 0))
        A.add(mat_stone, v, f, M)
        # 尖瓣（cusps）：券内两枚小三角凸
        for s in (-1, 1):
            t = 0.42
            idx = int(len(a) * (0.5 - s * 0.22))
            px, pz = a[max(0, min(len(a) - 1, idx))]
            cusp = [(px, pz), (px + (cx - px) * 0.35, pz - 0.05 - sub_w * 0.06), (px + (cx - px) * 0.18, pz - sub_w * 0.16)]
            v, f = prism(cusp, 0.18, glass_y - 0.19)
            A.add(mat_stone, v, f, M)
    # 头部：大券内圆窗
    if rose and lights >= 2:
        sub_apex = hs + arch_apex(sub_w)
        rr = min(w * 0.26, (apex - sub_apex) * 0.48)
        cz = sub_apex + (apex - sub_apex) * 0.48
        ring = circle2(rr, 20, 0, cz)
        v, f = sweep(rect_prof(bar * 0.9, 0.24), to3(ring, glass_y - 0.1), closed=True, up=(0, -1, 0))
        A.add(mat_stone, v, f, M)
        fl = foil(rr * 0.82, 4 if lights == 2 else 6, 32, 0, cz, math.pi / 4)
        v, f = sweep(rect_prof(bar * 0.6, 0.2), to3(fl, glass_y - 0.1), closed=True, up=(0, -1, 0))
        A.add(mat_stone, v, f, M)
    # 大券（窗框内沿）
    a = pointed_arch(w, 1.0, 12, 0, hs)
    v, f = sweep(rect_prof(bar * 1.1, 0.3, 0.035), to3(a, glass_y - 0.1), up=(0, -1, 0))
    A.add(mat_stone, v, f, M)
    for s in (-1, 1):
        v, f = sweep(rect_prof(bar * 1.1, 0.3, 0.035), [Vector((s * w / 2, glass_y - 0.1, 0)), Vector((s * w / 2, glass_y - 0.1, hs))], up=(0, -1, 0))
        A.add(mat_stone, v, f, M)
    # 玻璃（整片尖拱面）
    poly = opening_poly(w, hs, 1.0, 20)
    gv = [(x, glass_y, z) for x, z in poly]
    A.add(mat_glass, gv, [tuple(range(len(gv)))], M)
    # 洞口侧壁（进深）
    side = to3([(-w / 2 - 0.13, 0)] + [(x * (w + 0.26) / w, z) for x, z in a[:]] + [(w / 2 + 0.13, 0)])
    return apex

def reveal(A, mat, w, hs, depth, M, k=1.0, inset=0.0):
    """洞口内侧壁（尖拱进深）：把洞口轮廓沿 +y 扫出薄壁"""
    a = [(-w / 2, 0)] + pointed_arch(w, k, 20, 0, hs) + [(w / 2, 0)]
    v = []; f = []
    n = len(a)
    for i, (x, z) in enumerate(a):
        v.append((x, inset, z)); v.append((x, depth, z))
    for i in range(n - 1):
        f.append((2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1))
    A.add(mat, v, f, M)

# ---------------------------------------------------------------- 束柱 / 柱础 / 柱头
def column(A, mat, r, h, M, seg=12, base=True, cap=True, mat_cap=None):
    """哥特圆柱：方形柱础 + 阿提卡式柱础（双圆环夹凹槽）+ 柱身 + 钟形柱头 + 八角冠板"""
    if base:
        v, f = cbox(r * 3.0, r * 3.0, r * 0.9, 0.02); A.add(mat, v, f, M @ T(0, 0, r * 0.45))
        prof = [(r * 1.42, r * 0.9), (r * 1.42, r * 1.05)]
        for i in range(7):
            a = math.pi * i / 6; prof.append((r * 1.22 + r * 0.22 * math.sin(a), r * 1.05 + r * 0.2 * (1 - math.cos(a))))
        prof += [(r * 1.05, r * 1.5), (r * 1.08, r * 1.62)]
        for i in range(5):
            a = math.pi * i / 4; prof.append((r * 1.02 + r * 0.12 * math.sin(a), r * 1.62 + r * 0.14 * (1 - math.cos(a))))
        prof += [(r, r * 1.95)]
        v, f = revolve(prof, seg); A.add(mat, v, f, M, smooth=True)
        z0 = r * 1.95
    else: z0 = 0
    hc = r * 2.6 if cap else 0
    v, f = revolve([(r, z0), (r, h - hc)], seg, close_top=False, close_bot=False); A.add(mat, v, f, M, smooth=True)
    if cap:
        mc = mat_cap or mat
        prof = [(r, h - hc), (r * 1.1, h - hc), (r * 1.12, h - hc + r * 0.18), (r * 1.0, h - hc + r * 0.3)]
        for i in range(7):
            t = i / 6; prof.append((r * 1.0 + r * 0.55 * t ** 1.6, h - hc + r * 0.3 + (hc - r * 0.95) * t))
        prof += [(r * 1.62, h - r * 0.62)]
        v, f = revolve(prof, seg); A.add(mc, v, f, M, smooth=True)
        v, f = ngon_prism(r * 1.85, r * 0.6, 8, math.pi / 8); A.add(mat, v, f, M @ T(0, 0, h - r * 0.62))
        # 叶饰（卷叶 crockets 小球）
        for i in range(8):
            a = TAU * i / 8 + math.pi / 8
            v, f = leaf(r * 0.55); A.add(mc, v, f, M @ T(math.cos(a) * r * 1.35, math.sin(a) * r * 1.35, h - r * 1.15) @ RZ(a), smooth=True)

def clustered_pier(A, mat, R, h, M, shafts=8, r_shaft=None, seg=10, mat_cap=None, cap=True):
    """束柱：八角柱芯 + 周围附壁细柱（各自柱础/柱头），共享八角柱基"""
    rs = r_shaft or R * 0.28
    v, f = ngon_prism(R * 1.45, R * 0.7, 8, math.pi / 8); A.add(mat, v, f, M)
    v, f = ngon_prism(R * 1.3, 0.12, 8, math.pi / 8); A.add(mat, v, f, M @ T(0, 0, R * 0.7))
    v, f = revolve([(R * 0.92, R * 0.82), (R * 0.92, h - (R * 0.6 if cap else 0))], 16, close_top=not cap, close_bot=False); A.add(mat, v, f, M, smooth=True)
    for i in range(shafts):
        a = TAU * i / shafts
        rr = R * (0.95 if i % 2 == 0 else 0.86)
        column(A, mat, rs * (1.0 if i % 2 == 0 else 0.72), h - R * 0.82, M @ T(math.cos(a) * rr, math.sin(a) * rr, R * 0.82), seg, True, cap, mat_cap)
    if cap:
        v, f = ngon_prism(R * 1.5, R * 0.3, 8, math.pi / 8); A.add(mat, v, f, M @ T(0, 0, h - R * 0.3))

def leaf(s):
    """卷叶（crocket）：向外翻卷的小叶团，约 30 三角面"""
    prof = [(0.0, 0), (0.3 * s, 0.1 * s), (0.45 * s, 0.45 * s), (0.25 * s, 0.8 * s), (0, 0.8 * s)]
    v, f = revolve(prof, 5)
    # 压扁并向外翻卷
    v = [(x * 0.8, y * 0.55 + (z / s) ** 2 * 0.35 * s, z) for x, y, z in v]
    return v, f

def finial(A, mat, s, M):
    """尖顶花饰（fleuron 十字花）"""
    v, f = revolve([(0.0, 0), (0.12 * s, 0), (0.12 * s, 0.3 * s), (0.2 * s, 0.38 * s), (0.08 * s, 0.5 * s), (0.06 * s, 1.0 * s), (0.0, 1.25 * s)], 8); A.add(mat, v, f, M, smooth=True)
    for i in range(4):
        a = TAU * i / 4
        v, f = leaf(0.45 * s); A.add(mat, v, f, M @ T(math.cos(a) * 0.1 * s, math.sin(a) * 0.1 * s, 0.55 * s) @ RZ(a) @ RY(-0.5), smooth=True)

# ---------------------------------------------------------------- 小尖塔 / 尖塔
def pinnacle(A, mat, w, h, M, mat_gold='gold', crockets=True):
    """小尖塔：方柱身（四面盲尖券）+ 四面山花 + 方锥尖顶（棱上卷叶）+ 金色顶饰"""
    sh = h * 0.42
    v, f = cbox(w, w, sh, 0.02); A.add(mat, v, f, M @ T(0, 0, sh / 2))
    for i in range(4):
        a = TAU * i / 4
        Mi = M @ RZ(a) @ T(0, -w / 2 - 0.005, 0)
        # 盲券
        bw = w * 0.56
        ap = pointed_arch(bw, 1.0, 8, 0, sh * 0.62)
        v, f = sweep(rect_prof(0.04 * w * 3, 0.03 * w * 3), [Vector((-bw / 2, 0, sh * 0.12))] + to3(ap) + [Vector((bw / 2, 0, sh * 0.12))], up=(0, -1, 0)); A.add(mat, v, f, Mi)
        # 山花（gablet）
        gh = w * 0.95
        tri = [(-w / 2 - 0.02, sh), (w / 2 + 0.02, sh), (0, sh + gh)]
        v, f = prism(tri, w * 0.16, -0.04); A.add(mat, v, f, Mi)
        if crockets:
            for k in (1, 2):
                t = k / 3
                for s in (-1, 1):
                    v, f = leaf(w * 0.18); A.add(mat, v, f, Mi @ T(s * (w / 2) * (1 - t), -0.04, sh + gh * t) @ RX(-0.3), smooth=True)
    # 方锥
    sp = h - sh
    v, f = revolve([(w * 0.5 * math.sqrt(2), 0), (w * 0.05, sp * 0.92)], 4, math.pi / 4, math.pi / 4 + TAU); A.add(mat, v, f, M @ T(0, 0, sh))
    if crockets:
        nk = max(2, int(sp / (w * 0.6)))
        for k in range(1, nk):
            t = k / nk
            for i in range(4):
                a = TAU * i / 4 + math.pi / 4
                rr = w * 0.5 * math.sqrt(2) * (1 - t) + w * 0.05 * t
                v, f = leaf(w * 0.22 * (1 - t * 0.5)); A.add(mat, v, f, M @ T(math.cos(a) * rr, math.sin(a) * rr, sh + sp * 0.92 * t) @ RZ(a - math.pi / 2) @ RX(-0.4), smooth=True)
    finial(A, mat_gold, w * 0.7, M @ T(0, 0, sh + sp * 0.9))

def spire(A, mat, r, h, M, n=8, mat_gold='gold', crockets=True, lucarnes=True, bands=(0.25, 0.5, 0.75), mat_trim=None):
    """八角尖塔：八角锥（略内凹收分）+ 棱线卷叶 + 腰带 + 底部老虎窗（lucarne）+ 金色十字顶饰"""
    trim = mat_trim or mat
    prof = []
    for i in range(9):
        t = i / 8; prof.append((r * (1 - t) ** 1.08 + r * 0.02 * t, h * t * 0.97))
    v, f = revolve(prof, n, math.pi / n, math.pi / n + TAU); A.add(mat, v, f, M)
    # 棱肋
    for i in range(n):
        a = TAU * i / n + math.pi / n
        path = [Vector((math.cos(a) * pr * 1.01, math.sin(a) * pr * 1.01, pz)) for pr, pz in prof]
        v, f = sweep(rect_prof(r * 0.06, r * 0.06, r * 0.012), path, up=(math.cos(a), math.sin(a), 0)); A.add(trim, v, f, M)
        if crockets:
            nk = int(h / (r * 0.9))
            for k in range(1, nk):
                t = k / nk; pr = r * (1 - t) ** 1.08
                v, f = leaf(r * 0.16 * (1 - 0.6 * t)); A.add(trim, v, f, M @ T(math.cos(a) * pr * 1.04, math.sin(a) * pr * 1.04, h * 0.97 * t) @ RZ(a - math.pi / 2) @ RX(-0.5), smooth=True)
    for b in bands:
        pr = r * (1 - b) ** 1.08
        v, f = ngon_prism(pr * 1.06, r * 0.05, n, math.pi / n); A.add(mat_gold, v, f, M @ T(0, 0, h * 0.97 * b))
    if lucarnes:
        for i in range(0, n, 2):
            a = TAU * i / n
            lw, lh = r * 0.42, r * 0.9
            Ml = M @ RZ(a + math.pi / 2) @ T(0, -r * 0.74, r * 0.3)
            v, f = cbox(lw, r * 0.5, lh, 0.01); A.add(mat, v, f, Ml @ T(0, 0, lh / 2))
            v, f = prism([(-lw / 2 - 0.04, lh), (lw / 2 + 0.04, lh), (0, lh + lw * 1.1)], r * 0.55, -0.28 * r); A.add(trim, v, f, Ml)
            ap = opening_poly(lw * 0.6, lh * 0.55, 1.0, 8, 0, lh * 0.12)
            v = [(x, -r * 0.255, z) for x, z in ap]; A.add('glass', v, [tuple(range(len(v)))], Ml)
            finial(A, mat_gold, lw * 0.35, Ml @ T(0, 0, lh + lw * 1.05))
    # 顶部：金球 + 十字 / 罗盘星
    v, f = revolve([(0, 0), (r * 0.09, r * 0.02), (r * 0.1, r * 0.1), (r * 0.06, r * 0.2), (0, r * 0.22)], 10); A.add(mat_gold, v, f, M @ T(0, 0, h * 0.97), smooth=True)
    v, f = cbox(r * 0.035, r * 0.035, r * 0.8, 0.003); A.add(mat_gold, v, f, M @ T(0, 0, h * 0.97 + r * 0.6))
    v, f = cbox(r * 0.42, r * 0.035, r * 0.035, 0.003); A.add(mat_gold, v, f, M @ T(0, 0, h * 0.97 + r * 0.78))

# ---------------------------------------------------------------- 扶壁
def buttress(A, mat, w, d, h, M, stages=3, pin_h=None, mat_gold='gold', niche=False):
    """阶梯扶壁：每段向内退台，退台处做斜水（weathering）+ 滴水线；顶端小尖塔。M 原点 = 墙面底部中点，+y 指向墙外"""
    z = 0.0; dd = d
    seg = h / stages
    for s in range(stages):
        hh = seg * (1.0 if s < stages - 1 else 1.0)
        v, f = cbox(w, dd, hh, 0.025); A.add(mat, v, f, M @ T(0, dd / 2 - 0.05, z + hh / 2))
        # 斜水
        nd = dd * 0.72 if s < stages - 1 else dd * 0.5
        wedge = [(dd - 0.05, z + hh), (nd - 0.05, z + hh + (dd - nd) * 0.9), (nd - 0.05, z + hh)]
        v, f = prism([(y, zz) for y, zz in wedge], w + 0.06, -w / 2 - 0.03)
        v = [(yy, xx, zz) for xx, yy, zz in v]
        A.add(mat, v, f, M)
        # 滴水线（细腰线）
        v, f = cbox(w + 0.1, 0.12, 0.1, 0.02); A.add(mat, v, f, M @ T(0, dd - 0.04, z + hh - 0.2))
        if niche and s == 1:
            bw = w * 0.5
            ap = opening_poly(bw, hh * 0.45, 1.0, 10, 0, z + hh * 0.18)
            v = [(x, dd - 0.0, zz) for x, zz in ap]; A.add('stoneDark', v, [tuple(range(len(v)))], M)
        z += hh; dd = nd
    if pin_h:
        pinnacle(A, mat, w * 0.8, pin_h, M @ T(0, dd * 0.5, z + (d - dd) * 0.0), mat_gold)

def flying_buttress(A, mat, p0, p1, thick, M, w=0.6):
    """飞扶壁：从扶壁墩（p0，低）到高侧墙（p1，高）的弧形石拱 + 上缘斜坡压顶。p0/p1 为 (y, z) 在局部 yz 平面（x=0）"""
    (y0, z0), (y1, z1) = p0, p1
    pts_low = []; pts_top = []
    for i in range(13):
        t = i / 12
        y = y0 + (y1 - y0) * t
        z = z0 + (z1 - z0) * t - math.sin(math.pi * t) * 0.0
        # 下缘：四分之一圆弧（向下凹）
        zl = z0 + (z1 - thick * 1.6 - z0) * (1 - math.cos(math.pi / 2 * t)) ** 1.0
        zl = z0 - thick * 2 + (z1 - thick * 1.2 - (z0 - thick * 2)) * math.sin(math.pi / 2 * t) ** 1.5
        pts_low.append((y, zl)); pts_top.append((y, z0 + (z1 - z0) * t + thick * 0.4))
    poly = pts_top + pts_low[::-1]
    v, f = prism([(y, z) for y, z in poly], w, -w / 2)
    v = [(yy, xx, zz) for xx, yy, zz in v]
    A.add(mat, v, f, M)
    # 上缘压顶带 + 小卷叶
    path = [Vector((0, y, z + thick * 0.08)) for y, z in pts_top]
    v, f = sweep(rect_prof(w + 0.12, 0.12, 0.02), path, up=(0, 0, 1)); A.add(mat, v, f, M)

# ---------------------------------------------------------------- 墙、檐口、齿饰、栏杆
def wall_with_openings(A, mat, x0, x1, z0, z1, t, openings, M, ystart=0.0):
    """立面墙（x0..x1 × z0..z1，厚 t，+y 向内），开尖拱洞：openings=[(cx, w, hs, zb, k)]。
    方法：按竖条切分（洞口两侧实墙 + 洞口上方/下方实墙，洞头做尖拱拱肩）"""
    xs = sorted(openings, key=lambda o: o[0])
    cur = x0
    for (cx, w, hs, zb, k) in xs:
        a = cx - w / 2
        if a > cur + 1e-4:
            v, f = box(a - cur, t, z1 - z0); A.add(mat, v, f, M @ T((cur + a) / 2, ystart + t / 2, (z0 + z1) / 2))
        # 洞下
        if zb > z0 + 1e-4:
            v, f = box(w, t, zb - z0); A.add(mat, v, f, M @ T(cx, ystart + t / 2, (z0 + zb) / 2))
        # 洞头拱肩：多边形（矩形顶 - 尖拱）
        ztop = zb + hs + arch_apex(w, k)
        if z1 > zb + hs:
            arc = pointed_arch(w, k, 16, cx, zb + hs)
            zt = max(z1, ztop + 0.01)
            poly = [(cx - w / 2, zb + hs)] + [p for p in arc[1:-1]] + [(cx + w / 2, zb + hs), (cx + w / 2, min(z1, zt)), (cx - w / 2, min(z1, zt))]
            if z1 >= ztop:
                pv, pf = prism(poly[::-1] if signed_area(poly) < 0 else poly, t, ystart)
                # prism 截面在 xz，深度 y
                A.add(mat, pv, pf, M)
            # 洞侧壁（reveal）
        reveal(A, mat, w, hs, t, M @ T(cx, ystart, zb), k)
        cur = cx + w / 2
    if x1 > cur + 1e-4:
        v, f = box(x1 - cur, t, z1 - z0); A.add(mat, v, f, M @ T((cur + x1) / 2, ystart + t / 2, (z0 + z1) / 2))

def string_course(A, mat, x0, x1, z, M, h=0.32, d=0.28):
    """腰线（string course）：带斜水与滴水槽的水平线脚"""
    prof = [(0, 0), (d * 0.6, 0), (d * 0.75, h * 0.25), (d, h * 0.45), (d, h * 0.62), (0, h)]
    path = [Vector((x0, 0, z)), Vector((x1, 0, z))]
    pv = [(-y, x) for x, y in prof]
    v, f = sweep([(px, py) for px, py in [(-x, y) for x, y in prof]], [Vector((x0, 0, z)), Vector((x1, 0, z))], up=(0, -1, 0))
    # sweep 标架：N = up 投影 = -y（墙外），B = T×N
    A.add(mat, v, f, M)

def cornice(A, mat, x0, x1, z, M, h=0.9, d=0.7, dentils=True, mat_d=None):
    """檐口：冠顶线脚 + 齿饰带（dentils）+ 下方小尖券连续拱带（corbel table）"""
    prof = cornice_prof(h, d)
    v, f = sweep([(-(px), py) for px, py in [(p[0], p[1]) for p in prof]], [Vector((x0, 0, z)), Vector((x1, 0, z))], up=(0, -1, 0))
    v2 = []
    # sweep: 截面 (px,py) → P + N*px + B*py；N=-y（墙外），B=T×N=x×(-y)=-z → 需翻转 py
    v, f = sweep([(px, -py) for px, py in prof], [Vector((x0, 0, z)), Vector((x1, 0, z))], up=(0, -1, 0))
    A.add(mat, v, f, M)
    if dentils:
        md = mat_d or mat
        n = int((x1 - x0) / 0.32)
        for i in range(n):
            x = x0 + 0.16 + i * (x1 - x0 - 0.32) / max(1, n - 1)
            v, f = box(0.16, 0.18, 0.22); A.add(md, v, f, M @ T(x, -0.09, z - 0.13))
        # 连续小尖券（corbel table）
        n2 = int((x1 - x0) / 0.9)
        for i in range(n2):
            cx = x0 + 0.45 + i * (x1 - x0 - 0.9) / max(1, n2 - 1)
            ap = pointed_arch(0.7, 1.0, 6, cx, z - 0.9)
            v, f = sweep(rect_prof(0.07, 0.1, 0.01), [Vector((cx - 0.35, 0, z - 1.05))] + to3(ap, 0) + [Vector((cx + 0.35, 0, z - 1.05))], up=(0, -1, 0))
            A.add(md, v, f, M @ T(0, -0.05, 0))
            v, f = cbox(0.12, 0.14, 0.18, 0.01); A.add(md, v, f, M @ T(cx - 0.35, -0.07, z - 1.12))

def parapet(A, mat, x0, x1, z, M, h=1.1, t=0.32, mat_gold=None):
    """镂空女儿墙：压顶 + 底座 + 四叶形镂空板（每 1.2 m 一格）"""
    L = x1 - x0
    v, f = cbox(L, t, 0.22, 0.03); A.add(mat, v, f, M @ T((x0 + x1) / 2, 0, z + 0.11))
    v, f = cbox(L + 0.06, t + 0.12, 0.18, 0.03); A.add(mat, v, f, M @ T((x0 + x1) / 2, 0, z + h - 0.09))
    n = max(1, int(L / 1.2)); cw = L / n
    for i in range(n + 1):
        x = x0 + i * cw
        v, f = cbox(0.16, t, h - 0.4, 0.02); A.add(mat, v, f, M @ T(x, 0, z + h / 2))
    for i in range(n):
        cx = x0 + (i + 0.5) * cw; cz = z + h / 2
        r = min(cw, h - 0.4) * 0.42
        ring = circle2(r, 16, cx, cz)
        v, f = sweep(rect_prof(0.07, t * 0.8), to3(ring), closed=True, up=(0, -1, 0)); A.add(mat, v, f, M)
        fl = foil(r * 0.9, 4, 24, cx, cz, math.pi / 4, 0.45)
        v, f = sweep(rect_prof(0.05, t * 0.7), to3(fl), closed=True, up=(0, -1, 0)); A.add(mat, v, f, M)
        # 格内上下实心补块（圆框与压顶/底座之间）
        for zz, hh in ((z + 0.22, cz - r - z - 0.22), (cz + r, z + h - 0.18 - cz - r)):
            if hh > 0.01:
                v, f = box(cw - 0.16, t * 0.6, hh); A.add(mat, v, f, M @ T(cx, 0, zz + hh / 2))

def gable(A, mat, w, h, M, t=0.5, mat_gold='gold', crockets=True, coping=0.18):
    """山墙尖顶（wimperg）：三角墙 + 斜边压顶 + 卷叶 + 顶饰；M 原点为底边中点，+y 向内"""
    tri = [(-w / 2, 0), (w / 2, 0), (0, h)]
    v, f = prism(tri, t, 0); A.add(mat, v, f, M)
    L = math.hypot(w / 2, h)
    for s in (-1, 1):
        path = [Vector((s * (w / 2 + 0.05), -0.04, -0.05)), Vector((0, -0.04, h + 0.06))]
        v, f = sweep(rect_prof(coping * 1.6, coping, 0.02), path, up=(0, -1, 0)); A.add(mat, v, f, M)
        if crockets:
            nk = max(2, int(L / 0.9))
            for k in range(1, nk):
                tt = k / nk
                v, f = leaf(0.34); A.add(mat, v, f, M @ T(s * (w / 2) * (1 - tt), -0.05, h * tt + 0.12) @ RY(s * 0.4) @ RX(-0.35), smooth=True)
    finial(A, mat_gold, 0.7, M @ T(0, 0, h - 0.05))

def blind_arcade(A, mat, x0, x1, z0, hgt, n, M, depth=0.12, mat2=None):
    """盲拱廊：一排浅浮雕尖券（带小柱），用于塔身/墙面增加层次"""
    cw = (x1 - x0) / n
    for i in range(n):
        cx = x0 + (i + 0.5) * cw
        w = cw * 0.8
        hs = hgt - arch_apex(w)
        ap = pointed_arch(w, 1.0, 10, cx, z0 + hs)
        v, f = sweep(rect_prof(0.12, depth * 2, 0.02), [Vector((cx - w / 2, 0, z0))] + to3(ap) + [Vector((cx + w / 2, 0, z0))], up=(0, -1, 0)); A.add(mat, v, f, M)
        poly = opening_poly(w - 0.12, hs, 1.0, 10, cx, z0)
        v = [(x, depth * 0.6, z) for x, z in poly]; A.add(mat2 or mat, v, [tuple(range(len(v)))], M)

def stairs(A, mat, w, n, rise, run, M, nosing=0.03):
    """台阶（带踏面前缘圆角/凸缘）：自 y=0 起向 -y 下降"""
    for i in range(n):
        v, f = cbox(w, run + nosing, rise, 0.012); A.add(mat, v, f, M @ T(0, -i * run - run / 2, rise * (n - i) - rise / 2))
        # 每级之下填实
        if i < n - 1:
            v, f = box(w - 0.002, run, rise * (n - i - 1)); A.add(mat, v, f, M @ T(0, -i * run - run / 2, rise * (n - i - 1) / 2))

def rib_path_pointed(p0, p1, rise, n=16):
    """两点间（水平跨）的尖拱肋：p0, p1 为 Vector（同高），rise=矢高"""
    pts = []
    half = (p1 - p0).length / 2
    k = (half * half + rise * rise) / (2 * half) / (2 * half)  # 半径/跨
    w = 2 * half
    arc = pointed_arch(w, max(0.5, k), n, 0, 0)
    d = (p1 - p0).normalized()
    sc = rise / max(1e-6, arch_apex(w, max(0.5, k)))
    for x, z in arc:
        pts.append(p0 + d * (x + half) + Vector((0, 0, z * sc)))
    return pts


def wall_with_circle(A, mat, x0, x1, z0, z1, t, cx, cz, r, M, ystart=0.0, n=48):
    """墙面开圆洞（玫瑰窗）：洞外方框以外用实心块，方框内用圆→方的放射面片 + 洞内壁"""
    R = r + 0.8
    for (a0, a1, b0, b1) in ((x0, cx - R, z0, z1), (cx + R, x1, z0, z1), (cx - R, cx + R, z0, cz - R), (cx - R, cx + R, cz + R, z1)):
        if a1 - a0 > 1e-4 and b1 - b0 > 1e-4:
            v, f = box(a1 - a0, t, b1 - b0); A.add(mat, v, f, M @ T((a0 + a1) / 2, ystart + t / 2, (b0 + b1) / 2))
    v = []; f = []
    for i in range(n):
        a = TAU * i / n
        ca, sa = math.cos(a), math.sin(a)
        k = R / max(abs(ca), abs(sa))
        for y in (ystart, ystart + t):
            v.append((cx + ca * r, y, cz + sa * r)); v.append((cx + ca * k, y, cz + sa * k))
    for i in range(n):
        j = (i + 1) % n
        a, b = 4 * i, 4 * j
        f.append((a, b, b + 1, a + 1))            # 前面（y=ystart）
        f.append((a + 3, b + 3, b + 2, a + 2))    # 后面
        f.append((a + 2, b + 2, b, a))            # 洞内壁
    A.add(mat, v, f, M)
