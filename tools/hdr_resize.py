# Radiance .hdr (RGBE, RLE) 读写 + 下采样。用法：python3 hdr_resize.py in.hdr out.hdr 宽度
import sys, numpy as np
def read_hdr(p):
    f=open(p,'rb'); 
    while True:
        l=f.readline().strip()
        if l==b'': break
    dims=f.readline().split(); H=int(dims[1]); W=int(dims[3])
    data=np.frombuffer(f.read(),np.uint8); img=np.zeros((H,W,4),np.uint8); pos=0
    for y in range(H):
        if data[pos]==2 and data[pos+1]==2:
            pos+=4
            for c in range(4):
                x=0
                while x<W:
                    n=int(data[pos]); pos+=1
                    if n>128:
                        n-=128; img[y,x:x+n,c]=data[pos]; pos+=1
                    else:
                        img[y,x:x+n,c]=data[pos:pos+n]; pos+=n
                    x+=n
        else:
            img[y]=data[pos:pos+W*4].reshape(W,4); pos+=W*4
    e=img[...,3].astype(np.float32)
    s=np.where(img[...,3]>0, np.ldexp(1.0,(e-136).astype(np.int32)),0)
    return img[...,:3].astype(np.float32)*s[...,None]
def write_hdr(p,rgb):
    H,W,_=rgb.shape; m=rgb.max(-1); m=np.maximum(m,1e-32)
    mant,ex=np.frexp(m); sc=mant*256.0/m
    out=np.zeros((H,W,4),np.uint8)
    out[...,:3]=np.clip(rgb*sc[...,None],0,255).astype(np.uint8); out[...,3]=np.where(m>1e-32,ex+128,0).astype(np.uint8)
    with open(p,'wb') as f:
        f.write(b'#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y %d +X %d\n'%(H,W)); f.write(out.tobytes())
src,dst,w=sys.argv[1],sys.argv[2],int(sys.argv[3])
clampv=float(sys.argv[4]) if len(sys.argv)>4 else 1e9
im=read_hdr(src); H,W,_=im.shape; k=W//w
im=im[:H//k*k,:W//k*k].reshape(H//k,k,W//k,k,3).mean((1,3))
im=np.minimum(im,clampv)
write_hdr(dst,im.astype(np.float32)); print(dst,im.shape,float(im.max()))
