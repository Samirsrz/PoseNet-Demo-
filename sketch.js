let capture;
let posenet;
let allPoses = [];
let actionText = ""; 
let prevY = 0;
let jumpThreshold = 30; // adjust if needed
let smoothPose = null;
let smoothFactor = 0.4; // higher = smoother, lower = faster but shakier

function smoothKeypoints(pose) {
  if (smoothPose == null) {
    smoothPose = JSON.parse(JSON.stringify(pose));
    return smoothPose;
  }

  for (let key in pose) {
    smoothPose[key].x = smoothPose[key].x * smoothFactor + pose[key].x * (1 - smoothFactor);
    smoothPose[key].y = smoothPose[key].y * smoothFactor + pose[key].y * (1 - smoothFactor);
  }

  return smoothPose;
}


function detectActivity(pose) {
  let noseY = pose.nose.y;
  let leftWrist = pose.leftWrist;
  let rightWrist = pose.rightWrist;
  let leftHip = pose.leftHip;
  let rightHip = pose.rightHip;
  let leftKnee = pose.leftKnee;
  let rightKnee = pose.rightKnee;

  // 🔥 1. Jump detection
 let ankleLift = (pose.leftAnkle.y + pose.rightAnkle.y) / 2;

if (prevY !== 0 && (prevY - noseY) > 35 && ankleLift < prevAnkleY - 20) {
    actionText = "Jumping 🦘";
    actionColor = [255, 200, 0];
}
prevAnkleY = ankleLift;
prevY = noseY;


  // 🔥 2. Sitting detection
  let hipAvg = (leftHip.y + rightHip.y) / 2;
  let kneeAvg = (leftKnee.y + rightKnee.y) / 2;

  if (hipAvg > kneeAvg - 20) {
    actionText = "Sitting 🪑";
    actionColor = [0, 180, 255]; // deep blue
  }

  // 🔥 3. Hands up
  if (leftWrist.y < pose.nose.y - 40 && rightWrist.y < pose.nose.y - 40) {
    actionText = "Hands Up 🙌";
    actionColor = [0, 255, 120];
}


  // 🔥 4. Waving
  if (Math.abs(rightWrist.x - leftWrist.x) > 150 && rightWrist.y < pose.nose.y + 100) {
    actionText = "Waving 👋";
    actionColor = [255, 80, 80]; // soft red
  }
}



function setup() {
  let canvas = createCanvas(900, 600);
  canvas.parent("canvasContainer");

  capture = createCapture(VIDEO);
  capture.size(900, 600);
  capture.hide();

  posenet = ml5.poseNet(capture, modelLoaded);
  posenet.on("pose", receivedPoses);
}

function receivedPoses(poses) {
  allPoses = poses;
}

function modelLoaded() {
  console.log("PoseNet is ready!");
}

function draw() {
  background(0, 0, 0, 50);

  // Mirror camera
  push();  
  translate(width, 0);
  scale(-1, 1);

  // Draw camera feed
  image(capture, 0, 0, width, height);

  // Draw all people & detect activity
  for (let p = 0; p < allPoses.length; p++) {
    let pose = allPoses[p].pose;
    let skeleton = allPoses[p].skeleton;

    let stablePose = smoothKeypoints(pose);
detectActivity(stablePose);


    // Draw keypoints
    fill(255, 50, 50);
    noStroke();
    for (let kp of pose.keypoints) {
      ellipse(kp.position.x, kp.position.y, 12);
    }

    // Draw skeleton
    stroke(255,255,255 );
    strokeWeight(4);
    for (let bone of skeleton) {
      let p1 = bone[0].position;
      let p2 = bone[1].position;
      line(p1.x, p1.y, p2.x, p2.y);
    }
  }

  pop(); // end mirror transform

  // Show detected action (NOT mirrored)
  fill(255);
  textSize(32);
  textAlign(CENTER, TOP);
  text(actionText, width / 2, 10);
}
