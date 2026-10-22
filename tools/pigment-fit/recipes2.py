import sys; exec(open(sys.argv[3]).read())
from scipy.optimize import minimize
H=[("Red","#E03D30"),("Red-Orange","#E16333"),("Orange","#E18A33"),("Yellow-Orange","#E1AB33"),("Yellow","#E0C12D"),("Yellow-Green","#A9CA1E"),("Green","#2BBE1C"),("Blue-Green","#18A48E"),("Blue","#1D6CC5"),("Blue-Violet","#2020D3"),("Violet","#811FCC"),("Red-Violet","#CD1F79")]
ix={n:i for i,n in enumerate(names)}
def lch(lab): return lab[0], np.hypot(lab[1],lab[2]), np.arctan2(lab[2],lab[1])
def lab_of(c): return oklab_lin(lin(R_of(c)))
chrom=[n for n in names if n not in ('white','black','yellow oxide','red oxide')]
def tint_h(n):
    c=np.zeros(len(names)); c[ix[n]]=.3; c[ix['white']]=.7; return lch(lab_of(c))[2]
def hd(a,b): d=(a-b+np.pi)%(2*np.pi)-np.pi; return d
def solve(target):
    tL,tC,th=lch(oklab_lin(hex2lin(target)))
    cand=[n for n in chrom if abs(hd(tint_h(n),th))<np.radians(75)]
    best=(1e9,None)
    for k in (1,2):
        for combo in itertools.combinations(cand,k):
            idx=[ix[n] for n in combo]+[ix['white']]
            def obj(x):
                x=np.abs(x)+1e-9; c=np.zeros(len(names)); c[idx]=x; c/=c.sum()
                L,Cc,h=lch(lab_of(c))
                dH=2*np.sqrt(max(Cc*tC,1e-9))*np.sin(hd(h,th)/2)
                return (L-tL)**2 + (0.3*min(0,Cc-tC))**2 + (Cc-tC)**2*(Cc>tC) + (3*dH)**2
            for x0 in ([1,1][:k]+[1],[1,.3][:k]+[.3],[1,3][:k]+[2]):
                r=minimize(obj,np.array(x0,float),method='Nelder-Mead',options={'xatol':1e-6,'fatol':1e-10,'maxiter':4000})
                if r.fun<best[0]:
                    x=np.abs(r.x)+1e-9; c=np.zeros(len(names)); c[idx]=x; c/=c.sum(); best=(r.fun,c)
    return best[1]
out={}
for n,h in H:
    c=solve(h); L,Cc,hh=lch(lab_of(c)); tL,tC,th=lch(oklab_lin(hex2lin(h)))
    parts=', '.join(f'{names[i]} {c[i]*100:.0f}%' for i in np.argsort(-c) if c[i]>0.005)
    print(f'{n:14s} {h} -> {hexof(R_of(c))}  hue off {np.degrees(hd(hh,th)):+5.1f}°  C {Cc:.3f}/{tC:.3f}  L {L:.2f}/{tL:.2f} | {parts}')
    out[n]=c.tolist()
json.dump({'names':names,'recipes':out},open(sys.argv[4],'w'))
