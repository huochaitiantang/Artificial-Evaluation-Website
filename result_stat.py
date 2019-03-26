import os

def main():
    base_dirs = ["hand_pick_celeba_close", "hand_pick_celeba_smile", "hand_pick_download_close", "hand_pick_download_smile", "hand_pick_eval_gt_our", "hand_pick_eval_gt_cyclegan", "hand_pick_eval_gt_residual", "hand_pick_eval_gt_icgan"]
    base_root = "static/data"

    for base_dir in base_dirs:
        print(base_dir)
        run(os.path.join(base_root, base_dir))


def run(base_dir):
    shuffle_list = os.path.join(base_dir, 'test_list.txt')

    fin = open(shuffle_list, 'r')
    img_inds = fin.readlines()

    for i in range(len(img_inds)):
        img_ind = img_inds[i].strip().split()
        img_ind = map(lambda x: int(x), img_ind)
        img_inds[i] = img_ind
    item_cnt = len(img_inds[0])
    #print("test_list: ", img_inds)

    txt_ids = os.listdir(base_dir)
    txt_ids = filter(lambda x: x.endswith('.txt') and x.startswith('15'), txt_ids)
    #print("raw_label_id: ", txt_ids)

    labelss = []
    label_cnt = [0] * item_cnt
    for txt_id in txt_ids:
        cur_label_cnt = [0] * item_cnt
        with open(os.path.join(base_dir, txt_id)) as f:
            labels = f.readlines()
            for i in range(len(labels)):
                label = img_inds[i][int(labels[i])]
                labels[i] = label
                label_cnt[label] += 1
                cur_label_cnt[label] += 1
            labelss.extend(labels)
        print("{}: {}".format(txt_id, cur_label_cnt))
    #print(labelss)

    all_cnt = len(img_inds) * len(txt_ids)
    print("label : count")
    for i in range(item_cnt):
        print("{}:\t{}/{}\t[ {:.3f} % ]".format(i, label_cnt[i], all_cnt, label_cnt[i]/float(all_cnt)*100))
         

if __name__ == "__main__":
    main()
