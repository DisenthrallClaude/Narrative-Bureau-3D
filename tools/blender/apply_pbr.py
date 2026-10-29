# 在命令行串联：blender -b x.blend --python apply_pbr.py --python bake_lm.py -- ...（PBR_KIND=hall|ext，PBR_BAKE=1）
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pbr
pbr.apply(os.environ.get('PBR_KIND', 'hall'), bake=os.environ.get('PBR_BAKE') == '1')
