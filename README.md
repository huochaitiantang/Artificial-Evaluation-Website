# Artificial-Evaluation-Website

### Dependency
```
pip install Flask
```

### Setting
* Line 11 of main.py `base_name = '{test_base_dir}'` means the directory `static/data/{test_base_dir}`.
* Line 12 of main.py `item_cnt = 4` means 4 directories(`testA`, `testB`, `testC`, `testD`) of images for comparing.
* Line 13 of main.py `display_size = 128` means image display size is 128x128.
* The directory of input image `static/data/{test_base_dir}/origin` can be not existed.

### Start Website
```
python main.py
```

### Statistic
```
python result_stat.py
```
