import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {poseCameraMove,samplePoseCamera} from '../src/motion-pose-camera.js';

const near=(actual,expected)=>assert(actual.distanceTo(expected)<1e-8,actual.toArray()+' differs from '+expected.toArray());
const sample=(move,progress)=>{
 const target=new Vector3(),position=new Vector3();
 samplePoseCamera(move,progress,target,position);
 return {target,offset:position.sub(target)};
};

test('panning to another joint preserves the orbit angle and zoom at every step',()=>{
 const from=new Vector3(1,1,0),to=new Vector3(-1,.4,.3),orbit=new Vector3(-.4,.45,1.8);
 const move=poseCameraMove(from,orbit,to,orbit);
 near(sample(move,0).target,from);
 near(sample(move,.5).target,from.clone().lerp(to,.5));
 near(sample(move,1).target,to);
 for(const time of [0,.15,.38,.5,.9,1])near(sample(move,time).offset,orbit);
});

test('focus changes distance and target while keeping the current orientation',()=>{
 const from=new Vector3(2,1,0),to=new Vector3(0,2,0),orbit=new Vector3(1.5,.7,-.4);
 const destination=orbit.clone().setLength(.42);
 const move=poseCameraMove(from,orbit,to,destination);
 for(const time of [0,.1,.6,1])near(sample(move,time).offset.normalize(),orbit.clone().normalize());
 near(sample(move,1).offset,destination);
});

test('opposite presets orbit around the model and neighboring presets take the short turn',()=>{
 const center=new Vector3();
 const front=new Vector3(0,.08,3),back=new Vector3(0,.08,-3);
 const flip=poseCameraMove(center,front,center,back);
 const middle=sample(flip,.5).offset;
 assert(Math.abs(middle.x)>2.9);
 assert(Math.abs(middle.length()-front.length())<1e-8);
 near(sample(flip,1).offset,back);
 const wrap=poseCameraMove(center,new Vector3(.1,.08,-3),center,new Vector3(-.1,.08,-3));
 assert(sample(wrap,.5).offset.z<-2.9);
});
