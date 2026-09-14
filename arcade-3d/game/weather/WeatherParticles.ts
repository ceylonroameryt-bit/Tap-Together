import * as THREE from 'three';
export class WeatherParticles{
 geometry=new THREE.BufferGeometry();material=new THREE.PointsMaterial({color:'#e5f7ff',size:.09,transparent:true,opacity:0,depthWrite:false});points:THREE.Points;positions=new Float32Array(480*3);
 constructor(scene:THREE.Scene){for(let i=0;i<480;i++){this.positions[i*3]=((i*73)%157)/157*20-10;this.positions[i*3+1]=((i*31)%97)/97*12;this.positions[i*3+2]=((i*43)%139)/139*18-9;}this.geometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3));this.points=new THREE.Points(this.geometry,this.material);this.points.frustumCulled=false;scene.add(this.points);}
 update(dt:number,rain:number,snow:number,wind:number,reduced:boolean){this.material.opacity=Math.max(rain,snow)*.8;this.material.size=snow>.1?.12:.06;this.geometry.setDrawRange(0,Math.floor(480*Math.max(rain,snow)));if(reduced)return;for(let i=0;i<480;i++){this.positions[i*3+1]-=dt*(snow>.1?1.3:9);this.positions[i*3]+=dt*wind*2;if(this.positions[i*3]>10)this.positions[i*3]=-10;if(this.positions[i*3+1]<.1)this.positions[i*3+1]=12;}this.geometry.attributes.position.needsUpdate=true;}
 dispose(){this.points.removeFromParent();this.geometry.dispose();this.material.dispose();}
}
