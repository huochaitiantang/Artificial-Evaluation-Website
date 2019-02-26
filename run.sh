#!/bin/bash
python main.py \
    --data_base_dir static/data/test \
    --item_cnt 4 \
    --display_size 128 \
    --better_rule "此处为选取规则" \
    --run_ip 127.0.0.1 \
    --run_port 5000 \
    --random_place

