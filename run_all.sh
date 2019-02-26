#!/bin/bash

DATA_ROOT=static/data
ITEM_CNTS=(3 4 3 4 2 2 2 2)
DISPLAY_SIZE=128
RUN_IP=219.224.168.78
RUN_PORT_START=8008
NAVIGATOR_CNT=8

DATA_DIRS=("hand_pick_celeba_close" "hand_pick_celeba_smile" "hand_pick_download_close" "hand_pick_download_smile" "hand_pick_eval_gt_our" "hand_pick_eval_gt_cyclegan" "hand_pick_eval_gt_residual" "hand_pick_eval_gt_icgan")
BETTER_RULES[0]="下列的图像变换为：将人脸的眼睛由闭合转换为睁开。请从选项中选择转换更为成功的、看起来更为逼真的、与原图像色彩差异较小的结果。"
BETTER_RULES[1]="下列的图像变换为：将人脸由不笑转换为笑。请从选项中选择转换更为成功的、看起来更为逼真的、与原图像色彩差异较小的结果。"
BETTER_RULES[2]=${BETTER_RULES[0]}
BETTER_RULES[3]=${BETTER_RULES[1]}
BETTER_RULES[4]="请从选项中选择看起来更为逼真的、带有笑容的结果。"
BETTER_RULES[5]=${BETTER_RULES[4]}
BETTER_RULES[6]=${BETTER_RULES[4]}
BETTER_RULES[7]=${BETTER_RULES[4]}

for ((i=0;i<$NAVIGATOR_CNT;i++)) do
    ((RUN_PORT=$RUN_PORT_START+$i))
    echo "$i $DATA_ROOT/${DATA_DIRS[$i]} ${ITEM_CNTS[$i]} $DISPLAY_SIZE ${BETTER_RULES[$i]} $RUN_IP $RUN_PORT"

    python main.py \
        --data_base_dir $DATA_ROOT/${DATA_DIRS[$i]} \
        --item_cnt ${ITEM_CNTS[$i]} \
        --display_size $DISPLAY_SIZE \
        --better_rule ${BETTER_RULES[$i]} \
        --run_ip $RUN_IP \
        --run_port $RUN_PORT \
        --navigator_cnt $NAVIGATOR_CNT \
        --navigator_start_port $RUN_PORT_START \
        --random_place &
done
