import os

def main():
    base_dir = "static/data/smile/"
    shuffle_list = os.path.join(base_dir, 'test_list.txt')

    fin = open(shuffle_list, 'r')
    img_inds = fin.readlines()

    for i in range(len(img_inds)):
        img_ind = img_inds[i].strip().split()
        img_ind = map(lambda x: int(x), img_ind)
        img_inds[i] = img_ind
    print(img_inds)

    txt_ids = os.listdir(base_dir)
    txt_ids = filter(lambda x: x.endswith('.txt') and x.startswith('15'), txt_ids)
    print(txt_ids)

    labelss = []
    for txt_id in txt_ids:
        with open(os.path.join(base_dir, txt_id)) as f:
            labels = f.readlines()
            for i in range(len(labels)):
                label = img_inds[i][int(labels[i])]
                labels[i] = label
            labelss.extend(labels)
    print(labelss)

         

if __name__ == "__main__":
    main()
