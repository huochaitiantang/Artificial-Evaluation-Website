$(document).ready(function(){

    init_display()

    // get image paths infomation
    function init_display(){
        var p = get_promise('/msg_init')
        p.then(
            (res) => {
                ans = JSON.parse(res)
                console.log(ans)
                var input_img_paths = ans['input_img_paths']
                var result_img_pathss = ans['result_img_pathss']
                var display_size = ans['display_size']
                var better_rule = ans['better_rule']
                var img_cnt = result_img_pathss.length
                var item_cnt = result_img_pathss[0].length

                display_imgs(input_img_paths, result_img_pathss, img_cnt, item_cnt, display_size, better_rule)

                $("#submit_button").click(function(){
                    submit_label(img_cnt, item_cnt)
                })
            }
        )
    }

    // generate a promise object
    function get_promise(url){
        var p = new Promise(function(resolve, reject){
            var request = new XMLHttpRequest()
            request.open('GET', url, true)
            request.addEventListener("load", function(){
                resolve(this.responseText)
            })
            request.send()
        })
        return p
    }

    // display all imgs items
    function display_imgs(input_img_paths, result_img_pathss, img_cnt, item_cnt, display_size, better_rule){
        // column infomation div
        $("#better_rule").html(better_rule)
        var column_info  = "#序号"
        if(input_img_paths != null){
            column_info += " | 原始图片"
        }
        for(var i = 0; i < item_cnt; i++){
            column_info += " | 结果图片" + String.fromCharCode(i + 65)
        }
        $("#column_info").html(column_info)

        // display images item one by one
        for(var i = 0; i < img_cnt; i++){
            $("#content_div").append(generate_img_item(input_img_paths, result_img_pathss, i, display_size))

            // set the each image onclick event
            for(var j = 0; j < item_cnt; j++){
                $('#image_' + i + '_' + j).click(function(){
                    console.log($(this).parent().next().children().children().attr('id'))
                    // remove other all radio checked attribute
                    $(this).parent().parent().siblings().children().children().children().removeAttr('checked');
                    $(this).parent().next().children().children().attr('checked', 'true')
                })
            }
        }
    }

    // one line img item
    function generate_img_item(input_img_paths, result_img_pathss, img_ind, display_size){
        var node_string = "<div style='padding:10px;'><div style='display:inline-block;vertical-align:top;margin-right:10px;font-size:25px;font-style:italic;'>#" + format_number(img_ind + 1) + "</div>"
        if(input_img_paths != null){
            node_string += "<div style='display:inline-block;vertical-align:top;imargin-right:10px;'><img src='/" + input_img_paths[img_ind] + "' width='" + display_size + "px' height='" + display_size + "px'></div>"
        }
        for(var i = 0; i < result_img_pathss[img_ind].length; i++){
            node_string += generate_img_radio(result_img_pathss, img_ind, i, display_size)
        }
        node_string += "</div>"
        return node_string
    }

    function format_number(num){
        var bit_max = 3
        var res = ''+num
        var bit_sub = bit_max - res.length
        while(bit_sub > 0){
            res = '0' + res
            bit_sub -= 1
	}
	return res
    }

    // generate a img with radio
    function generate_img_radio(result_img_pathss, img_ind, item_ind, display_size){
        radio_name = "radio_" + img_ind
        radio_id = "radio_" + img_ind + "_" + item_ind
        image_id = "image_" + img_ind + "_" + item_ind

        node_string = "<div style='display:inline-block;vertical-align:top;margin-left:3px;'>"
        result_img_path = result_img_pathss[img_ind][item_ind]

        node_string = node_string + "<div><img id='" + image_id + "' src='" + result_img_path + "' width='" + display_size + "px' height='" + display_size + "px'></div>"
        node_string = node_string + "<div><label><input id='" + radio_id + "' name='" + radio_name + "' type='radio' value='" + item_ind + "'/>"+ String.fromCharCode(item_ind + 65) + "</label></div>"

        node_string = node_string + "</div>"
        return node_string
    }

    // submit label result
    function submit_label(img_cnt){
        $("#submit_info").empty()
        $("#submit_info").css({"color": "red"});
        var check_values = check_label_values(img_cnt)
        if(check_values != ""){
            var p = get_promise('/submit/' + check_values)
            p.then(
                (res) => {
                    ans = JSON.parse(res)
                    if(ans['status'] == 1){
                        $("#submit_info").css({"color": "blue"});
                        var info_input = $("#info_input").val().replace(/\s*/g,"")
                        $("#submit_info").html("提交成功，感谢你的参与，" + info_input + "　！")
                    }
                    else{
                        $("#submit_info").html("提交失败，请按规则填写！")
                    }
                }
            )
        }
    }

    // check if all the radios of items is checked
    function check_label_values(img_cnt){
        var check_values = ""
        for(var i = 0; i < img_cnt; i++){
            var radio_name = "radio_" + i
            var check_value = $("input:radio[name='radio_" + i + "']:checked").val()
            console.log("img="+ (i + 1) + " label=" + check_value)
            if(check_value != null){
                check_values += check_value + " "
            }
            else{
                $("#submit_info").html("提交错误：第" + (i + 1) + "张图片还未评价！")
                return ""
            }
        }
        var info_input = $("#info_input").val().replace(/\s*/g,"")
        if(info_input == ""){
            $("#submit_info").html("提交错误：请输入有效的姓名以便我们知道你的参与！")
            return ""
        }
        check_values += info_input
        return check_values
    }
})
