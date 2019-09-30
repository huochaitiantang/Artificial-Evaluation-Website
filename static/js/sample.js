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

                var display_h = ans['display_h']
                var emotion = ans['emotion']
                var sample_id = ans['sample_id']
                var sample_cnt = ans['sample_cnt']
                var frame_paths = ans['frame_paths']
                var scores = ans['scores']
                var orders = ans['orders']
                var frame_cnt = frame_paths.length

                $("#speed").html("进度：" + sample_id + "/" + sample_cnt)
                $("#emotion").html(emotion)
                display_sample(frame_paths, scores, orders, frame_cnt, display_h, emotion)
                
                $("#submit_button").click(function(){
                    submit_label(sample_id, frame_cnt, sample_cnt)
                })

                $("#prev_sample").click(function(){
                    if(sample_id > 1){
                        sample_id -= 1
                        var usr_name = $("#info_input").val().replace(/\s*/g,"")
                        window.location.href = "/" + sample_id + "?usr_name=" + usr_name 
                    }
                })
                
                $("#next_sample").click(function(){
                    if(sample_id < sample_cnt){
                        sample_id += 1
                        var usr_name = $("#info_input").val().replace(/\s*/g,"")
                        window.location.href = "/" + sample_id + "?usr_name=" + usr_name 
                    }
                })
                draw_canvas(frame_cnt, scores, orders)
            }
        )
    }

    function draw_canvas(frame_cnt, scores, orders){
        var canvas = document.getElementById('canvas')
        var W = 200
        var H = 400
        var border = 40
        var max_frame = orders[frame_cnt - 1]
        canvas.width = W + border * 1.5
        canvas.height = H + border * 1.5
        
        var ctx = canvas.getContext('2d')
        var y_step = H / max_frame
        var x_step = W / 4

        // draw grid and coordinate axis
        ctx.beginPath()
        ctx.strokeStyle="#EEEEEE"
        ctx.lineWidth=1
        // x grid
        for(var i = 0; i < 5; i++){
            var x0 = i * x_step + border
            var y0 = border
            var y1 = H + border
            ctx.moveTo(x0, y0)
            ctx.lineTo(x0, y1)
            ctx.stroke()
        }
        // y grid
        for(var i = 0; i <= 30; i++){
            var y0 = i / 30 * max_frame * y_step + border
            var x0 = border
            var x1 = W + border
            ctx.moveTo(x0, y0)
            ctx.lineTo(x1, y0)
            ctx.stroke()
        }
        ctx.closePath()
        // x axis
        ctx.fillStyle = "000000"
        ctx.textBaseline = "bottom"
        ctx.fillText("表情强度", W + border - 30, border / 2)
        for(var i = 0; i < 4; i++){
            ctx.fillText(i, (i+0.5) * x_step + border, border - 5)
        }
        // y axis
        ctx.fillText("帧", 5, H + border - 12)
        ctx.fillText("序", 5, H + border)
        ctx.fillText("号", 5, H + border + 12)
        ctx.textAlign="right"
        for(var i = 0; i < frame_cnt; i++){
            ctx.fillText(orders[i] + 1, border - 5, orders[i] * y_step + border + 8)
        }

        // draw pre scores points
        ctx.fillStyle="#FF0000"
        for(var i = 0; i < frame_cnt; i++){
            if(scores[i] < 0.1)
                x0 = (scores[i] / 0.1) * x_step + border
            else
                x0 = ((scores[i] - 0.1) / 0.9 * 3 + 1) * x_step + border
            y0 = orders[i] * y_step + border
            ctx.beginPath()
            ctx.arc(x0, y0, 2, 0, 2*Math.PI)
            ctx.closePath()
            ctx.fill()
        }
        // draw pre scores curve
        ctx.beginPath()
        ctx.strokeStyle="#FF0000"
        for(var i = frame_cnt - 2; i >= 0; i--){
            y = orders[i] * y_step + border
            if(scores[i] < 0.1)
                x = (scores[i] / 0.1) * x_step + border
            else
                x = ((scores[i] - 0.1) / 0.9 * 3 + 1) * x_step + border
            ctx.moveTo(x0, y0)
            ctx.lineTo(x, y)
            ctx.stroke()
            x0 = x
            y0 = y
        }
        ctx.closePath()
        // draw pick intensity(discrete)
    }

    function pre_intensity(score){
        if(score < 0.1) return 0
        if(score <= 0.4) return 1
        if(score <= 0.7) return 2
        return 3
    }

    // display a sample with all key frames
    function display_sample(frame_paths, scores, orders, frame_cnt, display_h, emotion){
        for(var i = 0; i < frame_cnt; i++){
            $("#content_div").append(display_one_line(frame_paths[i], orders[i], i, display_h, emotion))

            // bind the input event after display the input element!!!
            // set the default intensity based on score
            pre_label = pre_intensity(scores[i])
            console.log(i + " intensity=" + scores[i] + " pre label: " + pre_label)
            $("#radio_" + i + "_" + pre_label).attr('checked', 'true')
            $('input[type=radio][name=radio_' + i + ']').change(function(){
                console.log(this.name + " change:" + this.value)
                draw_canvas(frame_cnt, scores, orders)
            })
        }
    }

    // display one line
    function display_one_line(frame_path, order, frame_ind, display_h, emotion){
        // frame order
        var node_string = "<div style='padding:10px;'><div style='display:inline-block;vertical-align:top;margin-right:10px;font-size:20px;font-style:italic;'>#" + format_number(frame_ind + 1, 2) + "<br>("+ format_number(order + 1, 4) + ".jpg)</div>"
        // frame img with face rect
        node_string += "<div style='display:inline-block;vertical-align:top;margin-right:10px;'><img src='/" + frame_path + "' height='" + display_h + "px'></div>"
        // choice radio
        radio_name = "radio_" + frame_ind
        intensities = new Array("无", "弱", "中", "强")
        node_string += "<div style='display:inline-block;vertical-align:top;margin-right:10px;'>"
        for(var j = 0; j < 4; j++){
            radio_id = "radio_" + frame_ind + "_" + j
            node_string += "<div><label><input id='" + radio_id + "' name='" + radio_name + "' type='radio' value='" + j + "'/>"+ intensities[j] + "(" + emotion + ")</label></div>"
        } 
        node_string += "</div></div>"
        return node_string
    }


    function format_number(num, bit_max){
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
