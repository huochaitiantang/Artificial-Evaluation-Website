#-*- coding:utf-8 -*-

import os
import json
import time
import flask
import random
from flask import Flask
app = Flask("Turing")

# base setting
base_name = 'eval_gt_residual'
item_cnt = 2
display_size = 64
random_place = True
better_rule = '请从选项中选择看起来更为逼真的、带有笑容的结果。'
run_ip="219.224.168.78"
run_port=5007

# directory infomation
base_dir = os.path.join('static/data', base_name)
input_dir = os.path.join(base_dir, "origin")
if not os.path.exists(input_dir):
    input_dir = None

result_dirs = []
for i in range(item_cnt):
    cur_dir = "test{}".format(chr(65 + i))
    test_path = os.path.join(base_dir, cur_dir)
    assert(os.path.exists(test_path))
    result_dirs.append(test_path)

test_list_name = os.path.join(base_dir, 'test_list.txt')
display_size = min(1024/(item_cnt + 1), display_size)

# initial test list
def init_test_list(test_list_name, result_dirs, input_dir=None):

    if not os.path.exists(test_list_name):

        result_dir_len = len(result_dirs)
        assert(result_dir_len > 0)

        img_ids = os.listdir(result_dirs[0])
        img_ids.sort()
        assert(len(img_ids) > 0)

        for img_id in img_ids:
            for i in range(result_dir_len):
                cur_path = os.path.join(result_dirs[i], img_id)
                assert(os.path.exists(cur_path))

            if input_dir is not None:
                cur_path = os.path.join(input_dir, img_id)
                assert(os.path.exists(cur_path))

        with open(test_list_name, 'w') as f:
            img_id_inds = range(result_dir_len)

            for img_id in img_ids:
                if random_place:
                    random.shuffle(img_id_inds)
                for i in range(result_dir_len):
                    f.write("{} ".format(img_id_inds[i]))
                f.write("\n")


# resolve from the test list, return img path
def resolve_test_list(test_list_name, result_dirs, input_dir=None):
    assert(os.path.exists(test_list_name))
    with open(test_list_name, 'r') as f:

        result_img_pathss = []
        input_img_paths = []

        img_ids = os.listdir(result_dirs[0])
        img_ids.sort()

        lines = f.readlines()
        line_len = len(lines)

        for i in range(line_len):
            result_img_paths = []
            img_id = img_ids[i]
            img_inds = lines[i].strip().split() 

            for img_ind in img_inds:
                img_ind = int(img_ind)
                cur_path = os.path.join(result_dirs[img_ind], img_id)
                result_img_paths.append(cur_path)
            result_img_pathss.append(result_img_paths)

            if input_dir is not None:
                cur_path = os.path.join(input_dir, img_id)
                input_img_paths.append(cur_path)

        if input_dir is None:
            input_img_paths = None
        return input_img_paths, result_img_pathss


init_test_list(test_list_name, result_dirs, input_dir)
input_img_paths, result_img_pathss = resolve_test_list(test_list_name, result_dirs, input_dir)


@app.route('/')
def do_home():
    return flask.render_template('home.html')

@app.route('/msg_init')
def do_msg_init():
    info = {}
    info['display_size'] = display_size
    info['input_img_paths'] = input_img_paths
    info['result_img_pathss'] = result_img_pathss
    info['better_rule'] = better_rule
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
    file_name = os.path.join(base_dir, "{}_{}.txt".format(time_str, usr_name))

    with open(file_name, 'w') as f:
        for label in labels:
            if int(label) < 0 or int(label) >= len(result_img_pathss[0]):
                return json.dumps(info)
            f.write("{}\n".format(label))

    info['status'] = 1
    return json.dumps(info)


if __name__ == '__main__':
    app.run(host=run_ip, port=run_port, debug=True)
