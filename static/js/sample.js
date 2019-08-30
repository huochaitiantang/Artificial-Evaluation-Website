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
                
                $("#submit_button").click(function(){
                    submit_label(sample_id, frame_cnt, sample_cnt)
                })
            }
        )
    }

    // display a sample with all frames and faces
    function display_sample(frame_paths, face_paths, frame_cnt, display_size){
        for(var i = 0; i < frame_cnt; i++){
            $("#content_div").append(display_one_line(frame_paths[i], face_paths[i], i, display_size))

            // bind the input event after display the input element!!!
            // range input event
            $("#range_" + i).bind('input propertychange', function(){
                var intensity = $(this).val()
                $(this).parent().next().children().first().next().html(intensity)
                console.log($(this).parent().next().children().first().next().attr('id'))
                console.log("intensity:" + intensity)
            })

            // sub button click
            $("#button_sub_" + i).click(function(){
                var intensity = parseInt($(this).parent().prev().children().first().val())
                if(intensity > 0){
                    intensity -= 1
                }
                $(this).parent().prev().children().first().val(intensity)
                $(this).next().html(intensity)
                console.log($(this).next().attr('id'))
                console.log("intensity:" + intensity)
            })

            // add button click
            $("#button_add_" + i).click(function(){
                var intensity = parseInt($(this).parent().prev().children().first().val())
                if(intensity < 100){
                    intensity += 1
                }
                $(this).parent().prev().children().first().val(intensity)
                $(this).prev().html(intensity)
                console.log($(this).prev().attr('id'))
                console.log("intensity:" + intensity)
            })
        }
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

    // submit label result
    function submit_label(sample_id, frame_cnt, sample_cnt){
        $("#submit_info").empty()
        $("#submit_info").css({"color": "red"});
        var check_values = check_label_values(frame_cnt)
        if(check_values != ""){
            var p = get_promise('/submit/' + sample_id + '/' + check_values)
            p.then(
                (res) => {
                    ans = JSON.parse(res)
                    if(ans['status'] == 1){
                        var usr_name = $("#info_input").val().replace(/\s*/g,"")
                        // jump to next smaple with the usr name
                        if(sample_id < sample_cnt){
                            sample_id += 1
                            window.location.href = "/" + sample_id + "?usr_name=" + usr_name 
                        }
                        else{
                            $("#submit_info").css({"color": "blue"});
                            $("#submit_info").html("所有标注完成，谢谢您，" + usr_name + "　！")
                        }
                    }
                    else{
                        $("#submit_info").html("提交失败，请按规则填写！")
                    }
                }
            )
        }
    }

    // check if all the radios of items is checked
    function check_label_values(frame_cnt){
        var check_values = ""
        var no_change = true
        for(var i = 0; i < frame_cnt; i++){
            var intensity = $("#range_" + i).val()
            if(intensity != 50){
                no_change = false
            }
            check_values += intensity + " "
        }
        
        if(no_change == true){
            $("#submit_info").html("提交错误:标注结果不能都是初始值50!")
            return ""
        }

        //replace white char
        var info_input = $("#info_input").val().replace(/\s*/g,"")
        if(info_input == ""){
            $("#submit_info").html("提交错误：请输入有效的姓名以便我们知道你的参与！")
            return ""
        }

        check_values += info_input
        return check_values
    }
})
