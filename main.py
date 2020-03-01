#-*- coding:utf-8 -*-

import os
import json
import time
import flask
import random
import argparse
import cv2
import numpy as np
from xml.dom.minidom import parse
from xml.dom import minidom
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

# parse label xml file
def parse_xml(fname):
    with open(fname, 'r') as fh:
        doc = minidom.parse(fh)
        root = doc.documentElement
        metas = root.getElementsByTagName('Metatag')
        info = {
            "MovieTitle": metas[0].getAttribute('value'),
            "ClipName": metas[1].getAttribute('value'),
            "Emotion": int(metas[2].getAttribute('value')),
            "NameOfActor": metas[3].getAttribute('value'),
            "GenderOfActor": metas[4].getAttribute('value'),
            "AgeOfActor": int(metas[5].getAttribute('value')),
            "FrameStartIndex": int(metas[6].getAttribute('value')),
            "FrameEndIndex": int(metas[7].getAttribute('value')),
            "StartTime": metas[8].getAttribute('value'),
            "DuratitionTime": metas[9].getAttribute('value'),
        }
        faces = root.getElementsByTagName('Faces')[0].getElementsByTagName('Face')
        d = {}
        for face in faces:
            x1 = float(face.getElementsByTagName('x1')[0].childNodes[0].data)
            y1 = float(face.getElementsByTagName('y1')[0].childNodes[0].data)
            x2 = float(face.getElementsByTagName('x2')[0].childNodes[0].data)
            y2 = float(face.getElementsByTagName('y2')[0].childNodes[0].data)
            d[face.getAttribute('frame')] = [x1, y1, x2, y2]
        return d, info


def get_samples():
    samples = []
    data_dir = os.path.join(args.data_base_dir, "dataset")
    sub_dirs = ["_", "Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise"]
    cnt = 0
    acc_cnt = 0
    #for cls in range(1, len(sub_dirs)):
    for cls in range(1, 2):
        sub_dir = sub_dirs[cls]
        emotion_dir = os.path.join(data_dir, sub_dir)
        print("For ", sub_dir)
        for clip_id in sort_listdir(emotion_dir):
            base_dir = os.path.join(emotion_dir, clip_id)
            frame_dir = os.path.join(base_dir, "frames")
            d = {"frames": [], "scores": [], "key_indexs": [], \
                 "clip_id": clip_id, "faces": [], "smooth_scores": [], \
                 "clip_path0": os.path.join(base_dir, clip_id + ".mp4"),
                 "clip_path": "{}/vid_with_faces/{}.mp4".format(args.data_base_dir, clip_id),
                 }

            f = open("{}/predict_score_smooth/{}.txt".format(args.data_base_dir, clip_id))
            for line in f.readlines():
                items = line.split()
                cls = int(items[1])
                d['smooth_scores'].append(float(items[2 + cls]))

            # frames info
            faced, info = parse_xml(os.path.join(base_dir, "annotation.xml"))
            f = open("{}/predict_score/{}.txt".format(args.data_base_dir, clip_id))
            predicts = [0] * 7
            for line in f.readlines():
                items = line.split()
                d['frames'].append(os.path.join(frame_dir, items[0]))
                d['faces'].append(faced[items[0]])
                cls = int(items[1])
                d['scores'].append(float(items[2 + cls]))
                for ii in range(1, 7):
                    predicts[ii] = float(items[2 + ii])
            d['predict_label'] = int(np.array(predicts)[1:].argmax()) + 1
            f.close()
            d['class'] = cls
            img = cv2.imread(d['frames'][0])
            d['size'] = img.shape
            d['actor'] = info['NameOfActor']
            d['gender'] = info['GenderOfActor']
            d['age'] = info['AgeOfActor']
            d['key_indexs'] = [0, len(d['frames']) - 1]

            cnt += 1
            if d['class'] == d['predict_label']:
                acc_cnt += 1
            samples.append(d)
    samples = sorted(samples, key=lambda x: x['clip_id'], reverse=False)
    print("Accuracy: {:.5f} ({}/{})".format(float(acc_cnt) / cnt, acc_cnt, cnt))
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


emotion_names = ["_", "Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise"]
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
    info['display_w'] = 425
    info['emotion'] = emotion_names[smp['class']] # emotion
    info['predict'] = emotion_names[smp['predict_label']]
    info['emotion_cls'] = smp['class'] # emotion
    info['predict_cls'] = smp['predict_label']
    info['sample_cnt'] = sample_cnt
    info['sample_id'] = sample_id
    info['clip_path'] = smp['clip_path']
    info['clip_path0'] = smp['clip_path0']
    info['frame_paths'] = smp['frames']
    info['scores'] = smp['scores']
    info['smooth_scores'] = smp['smooth_scores']
    info['faces'] = smp['faces']
    info['key_indexs'] = smp['key_indexs']
    info['size'] = smp['size']
    info['actor'] = smp['actor']
    info['age'] = smp['age']
    info['gender'] = smp['gender']
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
    usr_name = labels.pop()
    print("recept:", clip_id, usr_name, labels)

    try:
        vals = [0, 0.333, 0.667, 1]
        keys = []
        for i in range(0, len(labels), 2):
            ind = int(labels[i])
            assert(ind < frame_cnt and ind >= 0)
            val = vals[int(labels[i+1])]
            keys.append((ind, val))
        print("annotation:", keys)
    except Exception as e:
        print(e)
        return json.dumps(info)

    # save file
    save_dir = "{}/label/{}".format(args.data_base_dir, usr_name)
    pre_name = "{}/{}-{:04d}-{}".format(save_dir, usr_name, sample_id, clip_id)
    if os.path.exists(save_dir):
        try:
            os.system("mv {}* {}/label/repeat/".format(pre_name, args.data_base_dir))
        except Exception as e:
            print("mv error:", e)
    else:
        os.makedirs(save_dir)

    file_name = "{}-{}.txt".format(pre_name, str(time.time()).replace('.', '+'))
    # write to the file
    with open(file_name, 'w') as f:
        f.write("{} {}".format(clip_id, len(keys)))
        for kk in keys:
            f.write(" {} {}".format(kk[0], kk[1]))

    info['status'] = 1
    return json.dumps(info)


if __name__ == '__main__':
    app.run(host=args.run_ip, port=args.run_port, debug=True)
