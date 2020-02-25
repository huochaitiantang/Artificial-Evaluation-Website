#-*- coding:utf-8 -*-

import os
import json
import time
import flask
import random
import argparse
from flask import Flask
app = Flask("Label")


def get_args():
    # base setting
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_base_dir", type=str, default="static/data/fer_new", help="base data directory")
    parser.add_argument("--run_ip", type=str, default="127.0.0.1", help="running ip address")
    parser.add_argument("--run_port", type=int, default=5000, help="running port")
    parser.add_argument('--navigator_cnt', type=int, default=1, help='navigator address count')
    parser.add_argument('--navigator_start_port', type=int, default=0, help='navigator start port')
    args = parser.parse_args()
    return args
args = get_args()


def sort_listdir(dd):
    dirs = os.listdir(dd)
    dirs.sort()
    return dirs


def get_samples():
    samples = []
    data_dir = os.path.join(args.data_base_dir, "dataset")
    sub_dirs = ["_", "Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise"]
    for cls in range(1, len(sub_dirs)):
        sub_dir = sub_dirs[cls]
        emotion_dir = os.path.join(data_dir, sub_dir)
        for clip_id in sort_listdir(emotion_dir):
            base_dir = os.path.join(emotion_dir, clip_id)
            frame_dir = os.path.join(base_dir, "frames_with_face")
            d = {"frames": [], "scores": [], "orders": [], "clip_id": clip_id, \
                 "clip_path": os.path.join(base_dir, clip_id + ".mp4")}
            
            # key frames read
            f = open(os.path.join(base_dir, "key_frame.txt"))
            for line in f.readlines():
                items = line.split()
                d['orders'].append(int(items[0]))
                d['frames'].append(os.path.join(frame_dir, items[1]))
                d['class'] = int(items[2])
                d['scores'].append(float(items[3]))
            f.close()
            samples.append(d)
    return samples


def get_refers():
    refers = [[],[],[],[],[],[],[]]
    allow_subjects = ['S052', 'S055', 'S074', 'S106', 'S111', 'S113', 'S121', 'S124', 'S125', 'S130', 'S132']
    base_dir = os.path.join(args.data_base_dir, "CK_extend")
    img_dir = os.path.join(base_dir, "cohn-kanade-images")
    label_dir = os.path.join(base_dir, "Emotion")
    sub_dirs = []

    for d1 in sort_listdir(label_dir):
        if d1 not in allow_subjects:
            continue
        path = os.path.join(label_dir, d1)
        if os.path.isdir(path):
            for d2 in sort_listdir(path):
                if os.path.isdir(os.path.join(path, d2)):
                    sub_dirs.append("{}/{}".format(d1, d2))
    
    for sub_dir in sub_dirs:
        sub_img_dir = os.path.join(img_dir, sub_dir)

        img_ids = [os.path.join(sub_img_dir, x) for x in sort_listdir(sub_img_dir)]
        img_ids = list(filter(lambda x: x.endswith("png"), img_ids))
        img_cnt = len(img_ids)
        step = img_cnt / 3.
        key_imgs = [img_ids[0], img_ids[int(step * 1)], img_ids[int(step * 2)], img_ids[img_cnt - 1]]

        sub_label_dir = os.path.join(label_dir, sub_dir)
        if len(os.listdir(sub_label_dir)) > 0:
            label_file = os.path.join(sub_label_dir, os.listdir(sub_label_dir)[0])
            with open(label_file) as f:
                label = int(float(f.readline()))
                if label != 2:
                    label = label - 1 if label > 2 else label
                    refers[label].append(key_imgs)
    random.seed(1234)
    for x in refers:
        random.shuffle(x)
    return refers


#emotion_names = ["_", "Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise"]
emotion_names = ["_", "生气，愤怒", "讨厌，厌恶", "恐惧，害怕", "开心，高兴", "悲伤，伤心", "惊讶，惊喜"]
samples = get_samples()
sample_cnt = len(samples)
refers = get_refers()
print("Sample Count:", sample_cnt)



@app.route('/')
def do_home():
    return flask.render_template('home.html', sample_cnt=sample_cnt)


@app.route('/refer/<int:emotion_id>')
def do_refer(emotion_id):
    return flask.render_template('refer.html')


@app.route('/refer_init/<int:emotion_id>')
def do_ref_init(emotion_id):
    print(emotion_id)
    emotion_id = max(1, min(emotion_id, len(emotion_names) - 1))
    info = {}
    info['display_w'] = 256
    info['emotion_id'] = emotion_id
    info['frames_paths'] = refers[emotion_id]
    info['emotion_names'] = emotion_names
    return json.dumps(info)
    

@app.route('/<int:sample_id>')
def do_sample(sample_id):
    usr_name = flask.request.args.get('usr_name')
    if usr_name is None:
        usr_name = ""
    return flask.render_template('sample.html', usr_name=usr_name)


@app.route('/msg_init/<int:sample_id>')
def do_msg_init(sample_id):
    sample_id = max(min(sample_cnt, sample_id), 1)
    smp = samples[sample_id - 1]
    info = {}
    info['display_h'] = 256
    info['emotion'] = emotion_names[smp['class']] # emotion
    info['emotion_label'] = smp['class']
    info['sample_cnt'] = sample_cnt
    info['sample_id'] = sample_id
    info['clip_path'] = smp['clip_path']
    info['frame_paths'] = smp['frames']
    info['scores'] = smp['scores']
    info['orders'] = smp['orders']
    return json.dumps(info)


@app.route('/submit/<int:sample_id>/<label_result>')
def do_submit(sample_id, label_result): 
    info = {}
    info['status'] = 0

    if sample_id < 1 or sample_id > sample_cnt:
        return json.dumps(info)
    
    smp = samples[sample_id - 1]
    clip_id = smp['clip_id']
    frame_cnt = len(smp['frames'])
    
    labels = label_result.encode('utf-8').split()
    if len(labels) != frame_cnt + 1:
        return json.dumps(info)
    usr_name = labels.pop()
    print(labels, usr_name, clip_id)

    # save file
    save_dir = "{}/label/{}".format(args.data_base_dir, usr_name)
    pre_name = "{}/{}-{:03d}-{}".format(save_dir, usr_name, sample_id, clip_id)
    if os.path.exists(save_dir):
        try:
            os.system("mv {}* {}/label/repeat/".format(pre_name, args.data_base_dir))
        except Exception as e:
            print("mv error:", e)
    else:
        os.makedirs(save_dir)

    file_name = "{}-{}.txt".format(pre_name, str(time.time()).replace('.', '_'))
    # write to the file
    with open(file_name, 'w') as f:
        f.write("{}".format(clip_id))
        for label in labels:
            if int(label) < 0 or int(label) > 3:
                return json.dumps(info)
            f.write(" {}".format(label))
    
    info['status'] = 1
    return json.dumps(info)


if __name__ == '__main__':
    app.run(host=args.run_ip, port=args.run_port, debug=True)
