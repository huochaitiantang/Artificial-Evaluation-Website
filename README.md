# Artificial-Evaluation-Website

### Dependency
```
pip install Flask
```

### Setting
* --data_base_dir(string): base data directory
* --item_cnt(int): num of test directories(testA, testB, ...)
* --display_size(int): display size of each image
* --better_rule(string): choose rules
* --run_ip(string): running ip address
* --run_port(int): running port
* --random_place(bool): random place the images from different directories?
* --navigator_cnt(int): navigator address count
* --navigator_start_port(int): navigator start port
* The directory of input image {data_base_dir}/origin can be not existed.
    
### Start Website
```
bash run.sh
```

### Stop Website
```
bash kill_all.sh
```

### Statistic
```
python result_stat.py
```
