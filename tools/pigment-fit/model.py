import json, sys, numpy as np, itertools
sys.path.insert(0, sys.argv[1]); 
from PaintMixing import Colorimetry as C
D=json.load(open(sys.argv[2])); WL=np.array(D['wl'])
X,Y,Z,E=[np.interp(WL,np.array(C.predefined_spectra[k].wavelengths),np.array(C.predefined_spectra[k].values)) for k in 'X Y Z D65'.split()]
W=np.stack([X*E,Y*E,Z*E]); W/= (Y*E).sum()   # rows -> XYZ with Y(white)=1
M=np.array([[3.2404542,-1.5371385,-0.4985314],[-0.9692660,1.8760108,0.0415560],[0.0556434,-0.2040259,1.0572252]])
names=list(D['paints']); K=np.array([D['paints'][n]['K'] for n in names]); S=np.array([D['paints'][n]['S'] for n in names])
def R_of(c):
    k=c@K; s=c@S; om=s/(k+s); return om/(2-om+2*np.sqrt(1-om))
def lin(R): return M@(W@R)
def gam(v): v=np.clip(v,0,1); return np.where(v<=0.0031308,12.92*v,1.055*v**(1/2.4)-0.055)
def hexof(R): return '#'+''.join(f'{int(round(x*255)):02x}' for x in gam(lin(R)))
def oklab_lin(l):
    l=np.clip(l,0,None)
    a=np.cbrt(np.array([[0.4122214708,0.5363325363,0.0514459929],[0.2119034982,0.6806995451,0.1073969566],[0.0883024619,0.2817188376,0.6299787005]])@l)
    return np.array([[0.2104542553,0.7936177850,-0.0040720468],[1.9779984951,-2.4285922050,0.4505937099],[0.0259040371,0.7827717662,-0.8086757660]])@a
def hex2lin(h):
    v=np.array([int(h[i:i+2],16)/255 for i in (1,3,5)]); return np.where(v<=0.04045,v/12.92,((v+0.055)/1.055)**2.4)
