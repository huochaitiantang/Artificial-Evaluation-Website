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
    fin = open(os.path.join(args.data_base_dir, "key_frame.txt"))
    for line in fin.readlines():
        items = line.split(' ')
        vid_ids.append(items[0])
        classes.append(int(items[1]))
        img_ids.append(["{0:04d}.jpg".format(int(items[x])) for x in range(2, len(items))])
    fin.close()
    return vid_ids, img_ids, classes

#emotion_names = ["_", "Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise"]
emotion_names = ["_", "生气，气愤，愤怒", "讨厌，厌恶，不喜欢，不高兴", "恐惧，害怕", "开心，高兴", "悲伤，伤心", "惊喜，惊奇，惊讶"]
vid_ids, img_ids, classes = get_samples()
print(vid_ids, img_ids, classes)

sample_cnt = len(vid_ids)

save_dir = os.path.join(args.data_base_dir, "label")
if not os.path.exists(save_dir):
    os.makedirs(save_dir)

def get_paths(sample_id):
    vid_id = vid_ids[sample_id - 1]
    img_id = img_ids[sample_id - 1]
    cls = classes[sample_id - 1]
    frame_dir = os.path.join(args.data_base_dir, "key_frames/{}".format(vid_id))
    face_dir = os.path.join(args.data_base_dir, "key_faces/{}".format(vid_id))

    frame_paths = [os.path.join(frame_dir, x) for x in img_id]
    face_paths = [os.path.join(face_dir, x) for x in img_id]

    return frame_paths, face_paths, cls



@app.route('/')
def do_home():
    
    return flask.render_template('home.html', sample_cnt=sample_cnt)


@app.route('/<int:sample_id>')
def do_sample(sample_id):
    usr_name = flask.request.args.get('usr_name')
    if usr_name is None:
        usr_name = ""
    return flask.render_template('sample.html', usr_name=usr_name)

@app.route('/msg_init/<int:sample_id>')
def do_msg_init(sample_id):

    sample_id = max(min(sample_cnt, sample_id), 1)
    frame_paths, face_paths, cls = get_paths(sample_id)
    info = {}
    info['display_size'] = 256
    info['better_rule'] = emotion_names[cls] # emotion
    info['sample_cnt'] = sample_cnt
    info['sample_id'] = sample_id
    info['frame_paths'] = frame_paths
    info['face_paths'] = face_paths
    
    return json.dumps(info)

@app.route('/submit/<int:sample_id>/<label_result>')
def do_submit(sample_id, label_result): 
    info = {}
    info['status'] = 0

    if sample_id < 1 or sample_id > sample_cnt:
        return json.dumps(info)
    
    frame_cnt = len(img_ids[sample_id - 1])
    vid_id = vid_ids[sample_id - 1]

    labels = label_result.encode('utf-8').split()
    if len(labels) != frame_cnt + 1:
        return json.dumps(info)
    usr_name = labels.pop()
    print(labels, usr_name)

    # save file
    time_str = str(time.time()).replace('.', '_')
    file_name = os.path.join(args.data_base_dir, "label/{}-{}-{}.txt".format(usr_name, vid_id, time_str))

    # write to the file
    with open(file_name, 'w') as f:
        f.write("{}".format(vid_id))
        for label in labels:
            if int(label) < 0 or int(label) > 100:
                return json.dumps(info)
            f.write(" {}".format(label))
    
    info['status'] = 1
    return json.dumps(info)


if __name__ == '__main__':
    app.run(host=args.run_ip, port=args.run_port, debug=True)
