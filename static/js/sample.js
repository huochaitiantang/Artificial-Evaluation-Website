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
                var clip_path = ans['clip_path']
                var frame_cnt = frame_paths.length

                $("#speed").html("进度：" + sample_id + "/" + sample_cnt)
                $("#emotion").html(emotion)
                display_sample(frame_paths, scores, orders, frame_cnt, display_h, emotion, clip_path)
                
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

    function draw_curve(ctx, points){
        var cnt = points.length
        // draw points
        for(var i = 0; i < cnt; i++){
            ctx.beginPath()
            ctx.arc(points[i][0], points[i][1], 2, 0, 2*Math.PI)
            ctx.closePath()
            ctx.fill()
        }
        // draw curve
        ctx.beginPath()
        x0 = points[cnt-1][0]
        y0 = points[cnt-1][1]
        for(var i = cnt - 2; i >= 0; i--){
            ctx.moveTo(x0, y0)
            ctx.lineTo(points[i][0], points[i][1])
            ctx.stroke()
            x0 = points[i][0]
            y0 = points[i][1]
        }
        ctx.closePath()
    }


    function draw_point(ctx, x0, y0){
        ctx.beginPath()
        ctx.arc(x0, y0, 2, 0, 2*Math.PI)
        ctx.closePath()
        ctx.fill()
    }

    function draw_canvas(frame_cnt, scores, orders){
        var canvas = document.getElementById('canvas')
        var W = 200
        var H = 400
        var border = 40
        var max_frame = orders[frame_cnt - 1]
        canvas.width = W + border * 1.5
        canvas.height = H + border * 1.5 + 40
        
        var ctx = canvas.getContext('2d')
        var y_step = H / max_frame
        var x_step = W / 4
        
        // draw grid and coordinate axis
        // x dash grid
        ctx.beginPath()
        ctx.strokeStyle="#EAEAEA"
        ctx.lineWidth=1
        ctx.setLineDash([2])
        for(var i = 0; i < 5; i++){
            var x0 = i * x_step + border
            var y0 = border
            var y1 = H + border
            ctx.moveTo(x0, y0)
            ctx.lineTo(x0, y1)
            ctx.stroke()
        }
        
        // y dash grid
        for(var i = 0; i <= 30; i++){
            var y0 = i / 30 * max_frame * y_step + border
            var x0 = border
            var x1 = W + border
            ctx.moveTo(x0, y0)
            ctx.lineTo(x1, y0)
            ctx.stroke()
        }
        ctx.closePath()
        
        // x solid grid
        ctx.beginPath()
        ctx.strokeStyle="#00FF00"
        for(var i = 0; i < 4; i++){
            var x0 = (i + 0.5) * x_step + border
            var y0 = border - 10
            var y1 = H + border + 10
            ctx.moveTo(x0, y0)
            ctx.lineTo(x0, y1)
            ctx.stroke()
        }

        // y solid grid
        for(var i = 0; i < frame_cnt; i++){
            x0 = border
            x1 = W + border
            y0 = orders[i] * y_step + border
            ctx.moveTo(x0, y0)
            ctx.lineTo(x1, y0)
            ctx.stroke()
        }
        ctx.closePath()

        // x axis
        ctx.fillStyle = "#000000"
        ctx.textBaseline = "bottom"
        ctx.fillText("表情强度", W + border - 30, 15)
        intensities = new Array("无", "弱", "中", "强")
        for(var i = 0; i < 4; i++){
            ctx.fillText(i + "(" + intensities[i] + ")", (i+0.5) * x_step + border - 8, border - 10)
        }
        // y axis
        ctx.fillText("帧", 5, H + border - 12)
        ctx.fillText("序", 5, H + border)
        ctx.fillText("号", 5, H + border + 12)
        ctx.textAlign="right"
        for(var i = 0; i < frame_cnt; i++){
            ctx.fillText(orders[i] + 1, border - 5, orders[i] * y_step + border + 6)
        }

        // draw pre scores points
        ctx.fillStyle="#FF0000"
        ctx.strokeStyle="#FF0000"
        ctx.setLineDash([])
        points = new Array()
        for(var i = 0; i < frame_cnt; i++){
            if(scores[i] < 0.1)
                x0 = (scores[i] / 0.1) * x_step + border
            else
                x0 = ((scores[i] - 0.1) / 0.9 * 3 + 1) * x_step + border
            y0 = orders[i] * y_step + border
            points.push(new Array(x0, y0))
        }
        draw_curve(ctx, points)

        // draw pick intensity(discrete)
        ctx.fillStyle="#0000FF"
        ctx.strokeStyle="#0000FF"
        points = new Array()
        for(var i = 0; i < frame_cnt; i++){
            val = parseInt($("input:radio[name='radio_" + i + "']:checked").val())
            x0 = (val + 0.5) * x_step + border
            y0 = orders[i] * y_step + border
            points.push(new Array(x0, y0))
        }
        draw_curve(ctx, points)

        // note
        ctx.textAlign="left"
        ctx.beginPath()
        ctx.strokeStyle = "#FF0000"
        ctx.fillStyle="#FF0000"
        y0 = canvas.height - 32
        ctx.moveTo(60, y0)
        ctx.lineTo(90, y0)
        ctx.stroke()
        ctx.fillText("模型事先预测的表情强度", 100, y0 + 5)
        ctx.closePath()
        draw_point(ctx, 60, y0)
        draw_point(ctx, 90, y0)

        ctx.beginPath()
        ctx.strokeStyle = "#0000FF"
        ctx.fillStyle="#0000FF"
        y1 = y0 + 20
        ctx.moveTo(60, y1)
        ctx.lineTo(90, y1)
        ctx.stroke()
        ctx.fillText("当前标注的表情强度", 100, y1 + 5)
        ctx.closePath()
        draw_point(ctx, 60, y1)
        draw_point(ctx, 90, y1)
    }

    function pre_intensity(score){
        if(score < 0.1) return 0
        if(score <= 0.4) return 1
        if(score <= 0.7) return 2
        return 3
    }

    // display a sample with all key frames
    function display_sample(frame_paths, scores, orders, frame_cnt, display_h, emotion, clip_path){
        $("#clip").append("<video controls='controls' style='height:" + display_h + "px;' src='" + clip_path + "'>")
        for(var i = 0; i < frame_cnt; i++){
            $("#content_div").append(display_one_line(frame_paths[i], orders[i], i, display_h, emotion))

            // bind the input event after display the input element!!!
            // set the default intensity based on score
            pre_label = pre_intensity(scores[i])
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
        var all_zero = true
        var values = ""
        for(var i = 0; i < frame_cnt; i++){
            val = parseInt($("input:radio[name='radio_" + i + "']:checked").val())
            if(val > 0) all_zero = false
            values += val + " "
        }
        if(all_zero == true){
            $("#submit_info").html("提交错误:标注结果不能都为0（无表情）!")
        }
        else{
            var usr_name = $("#info_input").val().replace(/\s*/g,"")
            if(usr_name == ""){
                $("#submit_info").html("提交错误：请输入有效的姓名以便我们知道你的参与！")
            }
            else{
                values += usr_name
                var p = get_promise('/submit/' + sample_id + '/' + values)
                p.then(
                    (res) => {
                        ans = JSON.parse(res)
                        if(ans['status'] == 1){
                            // jump to next smaple with the usr name
                            if(sample_id < sample_cnt){
                                console.log("next")
                                sample_id += 1
                                window.location.href = "/" + sample_id + "?usr_name=" + usr_name 
                            }
                            else{
                                $("#submit_info").css({"color": "blue"});
                                $("#submit_info").html("所有标注完成，谢谢您，" + usr_name + "　！")
                            }
                            }
                        else{
                            $("#submit_info").html("提交失败，请按要求填写！")
                        }
                    }
                )
            }
        }
    }

})
