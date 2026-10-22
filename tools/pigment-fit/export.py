import sys; exec(open(sys.argv[3]).read())
R=json.load(open(sys.argv[4]))
order=["Red","Red-Orange","Orange","Yellow-Orange","Yellow","Yellow-Green","Green","Blue-Green","Blue","Blue-Violet","Violet","Red-Violet"]
r4=lambda a:[float(f'{x:.4g}') for x in a]
data={'names':names,'K':[r4(k) for k in K],'S':[r4(s) for s in S],'W':[r4(w) for w in W],
      'recipes':[[float(f'{x:.4f}') for x in R['recipes'][n]] for n in order]}
open(sys.argv[5],'w').write(json.dumps(data,separators=(',',':')))
print(len(json.dumps(data,separators=(',',':'))),'bytes')
