// Recognizable equipment for the town. These meshes display game objects;
// ownership and production remain supplied by the application state.
export function createWorldProps({THREE,materials,geometry,glass=materials.teal}){
 const unit=geometry(new THREE.BoxGeometry(1,1,1));
 const round=geometry(new THREE.CylinderGeometry(1,1,1,16));
 const ball=geometry(new THREE.SphereGeometry(1,12,8));
 const ring=geometry(new THREE.TorusGeometry(1,.13,8,24));
 function mesh(parent,shape,material,position,scale,rotation){
  const part=new THREE.Mesh(shape,typeof material==='string'?materials[material]:material);
  part.position.set(...position);part.scale.set(...scale);if(rotation)part.rotation.set(...rotation);parent.add(part);return part;
 }
 const box=(p,m,x,y,z,w,h,d,r)=>mesh(p,unit,m,[x,y,z],[w,h,d],r);
 const cylinder=(p,m,x,y,z,r,h,rotation)=>mesh(p,round,m,[x,y,z],[r,h,r],rotation);
 function group(name){const g=new THREE.Group();g.name=name;return g;}
 function leaf(p,x,y,z,size=.12,angle=0){return mesh(p,ball,'leaf',[x,y,z],[size,size*.35,size*.6],[0,angle,.4]);}
 function plant(p,x,y,z,size=1){
  cylinder(p,'leaf',x,y+.12*size,z,.018*size,.24*size);
  leaf(p,x-.07*size,y+.13*size,z,.12*size,.4);
  leaf(p,x+.07*size,y+.2*size,z,.13*size,-.7);
 }
 function seedTray(){
  const g=group('Seedling tray');box(g,'coral',0,.09,0,1.22,.18,.85);box(g,'ink',0,.19,0,1.08,.06,.71);
  for(const x of[-.36,0,.36])for(const z of[-.2,.2]){
   cylinder(g,'roof',x,.23,z,.14,.07);plant(g,x,.26,z,.9);
  }
  box(g,'cream',.42,.44,.3,.18,.22,.025,[0,-.25,-.15]);
  return g;
 }
 function windowFrame(){
  const g=group('Greenhouse window frame');
  box(g,glass,0,.81,0,1.02,1.46,.045);
  for(const x of[-.57,.57])box(g,'cream',x,.82,0,.095,1.65,.1);
  for(const y of[.045,.82,1.6])box(g,'cream',0,y,.01,1.23,.08,.115);
  box(g,'cream',0,.82,.015,.065,1.58,.12);
  for(const x of[-.57,.57])box(g,'roof',x,.04,0,.25,.08,.38);
  g.rotation.y=-.12;return g;
 }
 function waterPump(){
  const g=group('Water pump');box(g,'roof',0,.065,0,1.1,.13,.7);
  cylinder(g,'coral',-.18,.43,0,.28,.63);cylinder(g,'cream',-.18,.78,0,.3,.08);
  cylinder(g,'teal',.35,.36,0,.21,.55,[0,0,Math.PI/2]);
  mesh(g,ring,'ink',[.66,.36,0],[.17,.17,.17],[0,Math.PI/2,0]);
  cylinder(g,'roof',-.18,.91,0,.065,.25);box(g,'cream',.05,1.04,0,.66,.07,.095,[0,0,-.12]);
  cylinder(g,'roof',-.18,.49,.32,.065,.48,[Math.PI/2,0,0]);
  cylinder(g,'gold',-.18,.51,.59,.09,.07,[Math.PI/2,0,0]);
  return g;
 }
 function partsDisplay(){
  const g=group('Three greenhouse parts');g.items=[windowFrame(),waterPump(),seedTray()];
  g.items.forEach((item,index)=>{item.position.x=(index-1)*3;g.add(item);});return g;
 }
 function wateringCan(){
  const g=group('Watering can');cylinder(g,'teal',0,.29,0,.29,.5);
  cylinder(g,'roof',0,.56,0,.2,.045);
  mesh(g,ring,'cream',[-.3,.36,0],[.32,.37,.28],[0,0,0]);
  cylinder(g,'teal',.4,.46,0,.065,.63,[0,0,-.78]);
  cylinder(g,'cream',.64,.7,0,.12,.07,[0,0,-.78]);return g;
 }
 function seedbags(){
  const g=group('Seed packets');
  for(let i=0;i<3;i++){
   const packet=group('Seed packet');packet.position.set((i-1)*.25,.05,Math.abs(i-1)*.07);packet.rotation.z=(i-1)*-.1;g.add(packet);
   box(packet,'cream',0,.28,0,.3,.52,.08);box(packet,'gold',0,.5,.045,.3,.055,.014);
   cylinder(packet,'leaf',0,.27,.053,.008,.19);leaf(packet,-.045,.26,.06,.065);leaf(packet,.045,.31,.06,.065);
  }return g;
 }
 function plantBed(){
  const g=group('Growing bed');box(g,'roof',0,.22,0,2.1,.42,1.2);box(g,'ink',0,.45,0,1.9,.08,1);
  for(const x of[-.62,0,.62])for(const z of[-.28,.28])plant(g,x,.49,z,1.45);
  for(const x of[-1.03,1.03])box(g,'cream',x,.5,0,.075,.13,1.2);
  return g;
 }
 return {partsDisplay,windowFrame,waterPump,seedTray,wateringCan,seedbags,plantBed};
}
