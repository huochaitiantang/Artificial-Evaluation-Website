$(document).ready(function(){
    var pathname = window.location.pathname
    var sample_id = pathname.substring(1)
    init_display(sample_id)

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

    // get image paths infomation
    function init_display(sample_id){
        var p = get_promise('/msg_init/' + sample_id)
        p.then(
            (res) => {
                ans = JSON.parse(res)
                console.log(ans)

                var display_size = ans['display_size']
                var better_rule = ans['better_rule']
                var sample_id = ans['sample_id']
                var sample_cnt = ans['sample_cnt']
                var frame_paths = ans['frame_paths']
                var face_paths = ans['face_paths']
                var frame_cnt = frame_paths.length

                $("#speed").html("进度：" + sample_id + "/" + sample_cnt)
                $("#better_rule").html(better_rule)
                display_sample(frame_paths, face_paths, frame_cnt, display_size)
                

                /*

                $("#submit_button").click(function(){
                    submit_label(img_cnt, item_cnt)
                })
                */
            }
        )
    }

    // Firefox, Google Chrome, Opera, Safari, Internet Explorer from version 9
    function OnInput (event) {
        //$('#demo').html(event.target.value);
        alert ("The new content: " + event.target.value);
    }
    // Internet Explorer
    function OnPropChanged (event) {
        if (event.propertyName.toLowerCase () == "value") {
            alert ("The new content: " + event.srcElement.value);
        }
    }



    // display a sample with all frames and faces
    function display_sample(frame_paths, face_paths, frame_cnt, display_size){
        for(var i = 0; i < frame_cnt; i++){
            $("#content_div").append(display_one_line(frame_paths[i], face_paths[i], i, display_size))

            // range input event
            $("#range_" + i).bind('input propertychange', function(){
                var instensity = $(this).val()
                $(this).parent().next().children().first().next().html(instensity)
                console.log($(this).parent().next().children().first().next().attr('id'))
                console.log("instensity:" + instensity)
            })

            // sub button click
            $("#button_sub_" + i).click(function(){
                var instensity = parseInt($(this).parent().prev().children().first().val())
                if(instensity > 0){
                    instensity -= 1
                }
                $(this).parent().prev().children().first().val(instensity)
                $(this).next().html(instensity)
                console.log($(this).next().attr('id'))
                console.log("instensity:" + instensity)
            })

            // add button click
            $("#button_add_" + i).click(function(){
                var instensity = parseInt($(this).parent().prev().children().first().val())
                if(instensity < 100){
                    instensity += 1
                }
                $(this).parent().prev().children().first().val(instensity)
                $(this).prev().html(instensity)
                console.log($(this).prev().attr('id'))
                console.log("instensity:" + instensity)
            })

        }
        // bind the input event after display the input element!!!

    }

    // display one line
    function display_one_line(frame_path, face_path, frame_ind, display_size){
        // frame order
        var node_string = "<div style='padding:10px;'><div style='display:inline-block;vertical-align:top;margin-right:10px;font-size:25px;font-style:italic;'>#" + format_number(frame_ind + 1) + "</div>"
        
        // face img 1/2
        node_string += "<div style='display:inline-block;vertical-align:top;margin-right:10px;'><img src='/" + face_path + "' width='" + display_size + "px' height='" + display_size + "px'></div>"

        // frame img
        node_string += "<div style='display:inline-block;vertical-align:top;margin-right:10px;'><img src='/" + frame_path + "' width='" + display_size + "px' height='" + display_size + "px'></div>"

        // input range from 0-100
        range_id = "range_" + frame_ind
        range_text = "range_text_" + frame_ind
        button_sub = "button_sub_" + frame_ind
        button_add = "button_add_" + frame_ind
        node_string += "<div style='display:inline-block;vertical-align:top;margin-right:10px;'><div style='display:inline-block;vertical-align:top;'>0</div>"
        node_string += "<div style='display:inline-block;vertical-align:top;'><div><input id='" + range_id + "' type='range'></div>"
        node_string += " <div style='font-size:18px;'><button id='" + button_sub + "' style='display:inline-block;vertical-align:top;margin:5px'>-</button><div id='" + range_text + "' style='display:inline-block;vertical-align:top;margin:5px;'>50</div><button id='" + button_add + "' style='display:inline-block;vertical-align:top;margin:5px'>+</button>"
        node_string += "</div></div> <div style='display:inline-block;vertical-align:top;'>100</div> <div>"
        
        return node_string
    }

    function format_number(num){
        var bit_max = 2
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
                // scroll to the not eval
                $("html,body").animate({scrollTop:$("#image_" + i + "_0").offset().top}, 500)
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
