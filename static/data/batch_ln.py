import os

img_root = "/home/liuliang/Desktop/dataset/liuji/results/hand_pick"

def mkdirs(d):
    if not os.path.exists(d):
        os.makedirs(d)


def ln_close(src, des):
    mkdirs(des)
    os.symlink(os.path.join(src, "origin"), os.path.join(des, "origin"))
    os.symlink(os.path.join(src, "our_add_swap"), os.path.join(des, "testA"))
    os.symlink(os.path.join(src, "cyclegan"), os.path.join(des, "testB"))
    os.symlink(os.path.join(src, "residual"), os.path.join(des, "testC"))

def ln_smile(src, des):
    mkdirs(des)
    os.symlink(os.path.join(src, "origin"), os.path.join(des, "origin"))
    os.symlink(os.path.join(src, "our_no_swap"), os.path.join(des, "testA"))
    os.symlink(os.path.join(src, "cyclegan"), os.path.join(des, "testB"))
    os.symlink(os.path.join(src, "residual"), os.path.join(des, "testC"))
    os.symlink(os.path.join(src, "icgan"), os.path.join(des, "testD"))

def ln_eval(src):
    des = "hand_pick_eval_gt_our"
    mkdirs(des)
    os.symlink(os.path.join(src, "gt"), os.path.join(des, "testA"))
    os.symlink(os.path.join(src, "our_no_swap"), os.path.join(des, "testB"))

    des = "hand_pick_eval_gt_cyclegan"
    mkdirs(des)
    os.symlink(os.path.join(src, "gt"), os.path.join(des, "testA"))
    os.symlink(os.path.join(src, "cyclegan"), os.path.join(des, "testB"))

    des = "hand_pick_eval_gt_residual"
    mkdirs(des)
    os.symlink(os.path.join(src, "gt"), os.path.join(des, "testA"))
    os.symlink(os.path.join(src, "residual"), os.path.join(des, "testB"))

    des = "hand_pick_eval_gt_icgan"
    mkdirs(des)
    os.symlink(os.path.join(src, "gt"), os.path.join(des, "testA"))
    os.symlink(os.path.join(src, "icgan"), os.path.join(des, "testB"))



def main():
    src = os.path.join(img_root, "celeba_close")
    des = "hand_pick_celeba_close"
    ln_close(src, des)

    src = os.path.join(img_root, "celeba_smile")
    des = "hand_pick_celeba_smile"
    ln_smile(src, des)

    src = os.path.join(img_root, "download_close")
    des = "hand_pick_download_close"
    ln_close(src, des)

    src = os.path.join(img_root, "download_smile")
    des = "hand_pick_download_smile"
    ln_smile(src, des)

    src = os.path.join(img_root, "eval_smile")
    ln_eval(src)
   

if __name__ == "__main__":
    main()
