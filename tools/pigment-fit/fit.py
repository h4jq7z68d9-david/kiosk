import json, sys, numpy as np
sys.path.insert(0, sys.argv[1])  # PaintMixing src for its CIE tables only
SRC=sys.argv[1]; OUT=sys.argv[2]
WL=np.arange(400,701,10.0)
def load(f):
    d=json.load(open(f'{SRC}/data/{f}')); wl=np.array(d[0]['values'])
    acc={}
    for e in d[1:]:
        acc.setdefault(e['name'],{'e':e,'r':[]})['r'].append(np.interp(WL,wl,np.array(e['reflectance'])/100.0))
    return {k:{**v['e'],'R':np.clip(np.mean(v['r'],axis=0),1e-4,0.9999)} for k,v in acc.items()}
mass=load('masstone.json'); mixes=load('mix1.json')
f=lambda R:(1-R)**2/(4*R)  # this repo's convention: K/S=(1-R)^2/(4R) with R=omega/(2-omega+2sqrt(1-omega))
P={'white':{'S':np.ones_like(WL),'K':f(mass['white']['R'])}}
for name,m in mass.items():
    if name=='white': continue
    mx=[x for x in mixes.values() if name in x['components']]
    assert len(mx)==1,name; mx=mx[0]
    c=mx['components']; tot=sum(c.values()); cp=c[name]/tot; cw=c['white']/tot
    a=f(m['R']); b=f(mx['R'])
    # K=a*S ; cp*K+cw*Kw = b*(cp*S+cw*Sw)  -> S = cw*(b*Sw - Kw)/(cp*(a-b))
    Kw,Sw=P['white']['K'],P['white']['S']
    Sp=cw*(b*Sw-Kw)/(cp*(a-b))
    bad=~np.isfinite(Sp)|(Sp<=0)
    if bad.any(): print('fix',name,int(bad.sum()),'bands'); Sp[bad]=np.interp(WL[bad],WL[~bad],Sp[~bad])
    P[name]={'S':Sp,'K':a*Sp}
def R_of(K,S):
    om=S/(K+S); return om/(2-om+2*np.sqrt(1-om))
# check round-trip
for name,m in mass.items():
    print(f'{name:18s} masstone err {np.abs(R_of(P[name]["K"],P[name]["S"])-m["R"]).max():.4f}  S range {P[name]["S"].min():.3g}..{P[name]["S"].max():.3g}')
json.dump({'wl':WL.tolist(),'paints':{k:{'K':v['K'].tolist(),'S':v['S'].tolist()} for k,v in P.items()},
           'masstone':{k:v['R'].tolist() for k,v in mass.items()}},open(OUT,'w'))
