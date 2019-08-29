#-*- coding:utf-8 -*-

import os
import json
import time
import flask
import random
import argparse
from flask import Flask
app = Flask("Turing")

def get_args():
    # base setting
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_base_dir", type=str, default="static/data/fer", help="base data directory")
    parser.add_argument("--display_size", type=int, default=128, help="display size of each image")
    parser.add_argument("--better_rule", type=str, default="此处为选取规则", help="choose rules")
    parser.add_argument("--run_ip", type=str, default="127.0.0.1", help="running ip address")
    parser.add_argument("--run_port", type=int, default=5000, help="running port")
    parser.add_argument('--navigator_cnt', type=int, default=1, help='navigator address count')
    parser.add_argument('--navigator_start_port', type=int, default=0, help='navigator start port')
    args = parser.parse_args()
    return args

args = get_args()

def get_samples():
    vid_ids = []
    img_ids = []
    classes = []
    fin = open(os.path.join(args.data_base_dir, "tmp_key_frame.txt"))
    for line in fin.readlines():
        items = line.split(' ')
        vid_ids.append(items[0])
        classes.append(int(items[1]))
        img_ids.append(["{0:04d}.jpg".format(int(items[x])) for x in range(2, len(items))])
    fin.close()
    return vid_ids, img_ids, classes

emotion_names = ["_", "Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise"]
vid_ids, img_ids, classes = get_samples()
print(vid_ids, img_ids, classes)

sample_id = 1
sample_cnt = len(vid_ids)

def get_paths():
    global sample_id
    vid_id = vid_ids[sample_id - 1]
    img_id = img_ids[sample_id - 1]
    cls = classes[sample_id - 1]
    frame_dir = os.path.join(args.data_base_dir, "key_frames")
    face_dir = os.path.join(args.data_base_dir, "key_faces")

    frame_paths = [os.path.join(frame_dir, x) for x in img_id]
    face_paths = [os.path.join(face_dir, x) for x in img_id]

    return frame_paths, face_paths, cls



@app.route('/')
def do_home():
    return flask.render_template('home.html')


@app.route('/<int:smp_id>')
def do_sample(smp_id):
    global sample_id
    sample_id = smp_id
    sample_id = min(sample_id, sample_cnt)
    sample_id = max(sample_id, 1)
    return flask.render_template('sample.html')


@app.route('/msg_init')
def do_msg_init():
    global sample_id
    frame_paths, face_paths, cls = get_paths()
    info = {}
    info['display_size'] = args.display_size
    info['better_rule'] = args.better_rule
    info['sample_id'] = sample_id
    info['sample_cnt'] = sample_cnt
    info['frame_paths'] = frame_paths
    info['face_paths'] = face_paths
    info['emotion'] = emotion_names[cls]
    
    return json.dumps(info)

@app.route('/submit/<label_result>')
def do_submit(label_result): 
    info = {}
    info['status'] = 0

    labels = label_result.encode('utf-8').split()
    if len(labels) != len(result_img_pathss) + 1:
        return json.dumps(info)

    usr_name = labels.pop()
    print(labels, usr_name)

    time_str = str(time.time()).replace('.', '_')
    file_name = os.path.join(args.data_base_dir, "{}_{}.txt".format(time_str, usr_name))

    with open(file_name, 'w') as f:
        for label in labels:
            if int(label) < 0 or int(label) >= len(result_img_pathss[0]):
                return json.dumps(info)
            f.write("{}\n".format(label))

    info['status'] = 1
    return json.dumps(info)


if __name__ == '__main__':
    app.run(host=args.run_ip, port=args.run_port, debug=True)
