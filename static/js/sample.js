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

                var display_w = ans['display_w']
                var emotion = ans['emotion']
                var predict = ans['predict']

                var sample_id = ans['sample_id']
                var sample_cnt = ans['sample_cnt']
                var frame_paths = ans['frame_paths']
                var scores = ans['scores']
                var smooth_scores = ans['smooth_scores']
                var faces = ans['faces']
                var key_indexs = ans['key_indexs']
                var clip_path = ans['clip_path']
                var clip_path0 = ans['clip_path0']
                var origin_size = ans['size']
                var frame_cnt = frame_paths.length

                var actor = ans['actor']
                var age = ans['age']
                var gender = ans['gender']

                $("#speed").html("Process: " + sample_id + "/" + sample_cnt + "[" + ((sample_id / sample_cnt) * 100).toFixed(2) + " %]")
                $("#emotion").html(emotion)
                $("#emotion").attr("href", "/refer/" + ans['emotion_cls'])
                $("#predict").html(predict)
                $("#predict").attr("href", "/refer/" + ans['predict_cls'])
                $('#actor').html(actor)
                $('#age').html(age)
                $('#gender').html(gender)
                $('#frame_cnt').html(format_number(frame_cnt - 1, 3))

                $('#clip').attr('width', display_w)
                $('#clip').attr('src', clip_path)
                $('#clip0').attr('width', display_w)
                $('#clip0').attr('src', clip_path0)
                //draw_canvas(frame_cnt, scores, orders)

                init_key_frames(smooth_scores, key_indexs)
                
                $("#submit_button").click(function(){
                    submit_label(sample_id, sample_cnt)
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

                $("#prev_frame").click(function(){
                    vid = document.getElementById('clip')
                    jump_to_frame(Math.round(vid.currentTime * 25) - 1)
                })

                $("#next_frame").click(function(){
                    vid = document.getElementById('clip')
                    jump_to_frame(Math.round(vid.currentTime * 25) + 1)
                })

                $("#jump_frame").click(function(){
                    vid = document.getElementById('clip')
                    jump_to_frame(parseInt($("#jump_id").val()))
                })

                $("#add_key_frame").click(function(){
                    frame_id = parseInt($("#frame_id").html())
                    trs = $(this).parent().parent().next().find("table .key_frame_item")
                    intensity = pre_intensity(smooth_scores[frame_id])
                    flag = true
                    prev_tr = $(this).parent().parent().next().find("table tr")[0]

                    // insert key in the correct location
                    for(var j = 0; j < trs.length; j++){               
                        tds = trs[j].children 
                        cur_no = parseInt(tds[0].firstChild.data)
                        cur_ind = parseInt(tds[1].firstChild.data)
                        if(cur_ind > frame_id){
                            if(flag){
                                add_key_frame(cur_no, frame_id, intensity, prev_tr)
                                flag = false
                            }
                            tds[0].firstChild.data = cur_no + 1
                        }
                        prev_tr = trs[j]
                    }
                    if(flag){
                        add_key_frame(cur_no + 1, frame_id, intensity, prev_tr)
                    }
                })

                setInterval(function(){
                    vid = document.getElementById('clip')
                    frame_id = Math.round(vid.currentTime * 25)
                    frame_id = Math.min(frame_cnt - 1, Math.max(0, frame_id))
                    $("#frame_id").html(format_number(frame_id, 3))
                    $("#predict_score").html(smooth_scores[frame_id].toFixed(5) + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp")

                    trs = $("#key_frames").find(".key_frame_item")
                    //console.log(trs)
                    // find the current index and get all keys values
                    target = -1
                    keys = new Array()
                    for(var j = 0; j < trs.length; j++){
                        ind = parseInt(trs[j].children[1].firstChild.data)
                        label_intensity = parseInt($("#select_" + ind).val())
                        keys.push(new Array(ind, label_intensity))
                        if(ind == frame_id) target = j
                    }
                        
                    inter_scores = inter_keys(frame_cnt, keys)
                    //console.log(inter_scores)

                    // set or reset the add key frame button
                    $("#intensity_score").html(inter_scores[frame_id].toFixed(5))
                    $("#add_key_frame").attr("disabled", false)
                    $("#is_key_frame").html("No")
                    $("#is_key_frame").css("color", "blue")
                    if(target >= 0){
                        $("#add_key_frame").attr("disabled", true)
                        $("#is_key_frame").html("Yes")
                        $("#is_key_frame").css("color", "red")
                        intensity_names = new Array("None", "Weak", "Medium", "Intense")
                        cur_name = intensity_names[keys[target][1]]
                        $("#intensity_score").html(inter_scores[frame_id].toFixed(5) + "[" + cur_name + "]")
                    }

                    // draw preview
                    draw_canvas(frame_id, frame_cnt, keys, inter_scores, scores, smooth_scores)

                }, 40)

            }
        )
    }

    // interpolate the scores of all frames based on key frames
    function inter_keys(frame_cnt, keys){
        var ans = new Array()
        var key_cnt = keys.length
        vals = new Array(0, 0.33, 0.66, 1)

        // smmoth derivative values between three key frames
        smooth_ds = new Array()
        prev_d = (vals[keys[1][1]] - vals[keys[0][1]])/(keys[1][0] - keys[0][0])
        smooth_ds.push(prev_d)
        for (var k = 1; k < key_cnt - 1; k++){
            cur_d = (vals[keys[k+1][1]] - vals[keys[k][1]])/(keys[k+1][0] - keys[k][0])
            // if trend like --, -/, -\, /-, \-, /\, \/, set d = 0
            if((cur_d == 0)||(prev_d == 0)||(cur_d * prev_d < 0)) smooth_ds.push(0)
            // if trend like //, \\, set d smooth
            else smooth_ds.push((prev_d + cur_d) / 2)
            prev_d = cur_d
        }
        smooth_ds.push(prev_d)

        // init derivative of x_(k-1)
        prev_d = smooth_ds[0]
        x_prev = keys[0][0]
        y_prev = vals[keys[0][1]]
         
        for(var k = 1; k < key_cnt; k++){
            x = keys[k][0]
            y = vals[keys[k][1]]
            cur_d = smooth_ds[k]
            
            diff_x = x - x_prev
            diff_y = y - y_prev
            diff_g = cur_d - prev_d
            sum_x = x + x_prev
            sum_g = cur_d + prev_d
            x2 = x * x
            
            // f(x) = a*x^3+b*x^2+c*x^2+d
            // f(x_k) = y_k, f(x_k-1) = y_k-1, f'(x_k) = g_k, f'(x_k-1) = g_k-1
            a = (sum_g - 2 * (diff_y / diff_x)) / (diff_x * diff_x)
            b = 0.5 * (diff_g / diff_x - 3 * a * sum_x)
            c = cur_d - 2 * b * x - 3 * a * x2
            d = y - c * x - b * x2 - a * x * x2

            for(var j = x_prev; j < x; j++){
                j2 = j * j
                cur_y = a * j * j2 + b * j2 + c * j + d
                ans.push(cur_y)
            }
            prev_d = cur_d
            x_prev = x
            y_prev = y
            
            /* quadratic function: not continuous
            a = (diff_y - x_prev_d * diff_x) / (diff_x * diff_x)
            b = x_prev_d - 2 * a * x_prev
            c = y - a * x * x - b * x
            */
        }

        // for frames after second-last key frames
        for(var j = x; j < frame_cnt; j++){
            j2 = j * j
            cur_y = a * j * j2 + b * j2 + c * j + d
            ans.push(cur_y)
        }
        return ans
    }

    // set cur frame to some index
    function jump_to_frame(frame_id){
        vid = document.getElementById('clip')
        t = parseFloat(frame_id) /25 
        if((t >= 0) && (t <= vid.duration)){
            vid.currentTime = t
            console.log("Jump to " + t + " s" + " [" + frame_id + "]")
        }
    }

    function draw_curve(ctx, points, draw_point){
        var cnt = points.length
        // draw points
        if(draw_point){
            for(var i = 0; i < cnt; i++){
                ctx.beginPath()
                ctx.arc(points[i][0], points[i][1], 2, 0, 2*Math.PI)
                ctx.closePath()
                ctx.fill()
            }
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

    function draw_canvas(frame_id, frame_cnt, keys, inter_scores, scores, smooth_scores){
        var canvas = document.getElementById('canvas')
        var W = 750
        var H = 200
        var border = 45
        
        canvas.width = W + border * 2
        canvas.height = H + border * 2

        //console.log(frame_id + " " + frame_cnt + " " + keys + " " + inter_scores + " " + scores)
        
        var ctx = canvas.getContext('2d')
        var x_step = W / (frame_cnt - 1)
        var y_step = H / 3
        
        // draw grid and coordinate axis
        // y dash grid
        ctx.beginPath()
        ctx.strokeStyle="#EAEAEA"
        ctx.lineWidth=1
        ctx.setLineDash([2])
        for(var i = 0; i < 6; i++){
            var y0 = i * y_step / 2 + border
            var x0 = border - 5
            var x1 = W + border + 5
            ctx.moveTo(x0, y0)
            ctx.lineTo(x1, y0)
            ctx.stroke()
        }
        
        // x dash grid
        for(var i = 0; i <= 30; i++){
            var x0 = i / 30 * (frame_cnt-1) * x_step + border
            var y0 = border
            var y1 = H + border
            ctx.moveTo(x0, y0)
            ctx.lineTo(x0, y1)
            ctx.stroke()
        }
        ctx.closePath()

        // y solid grid
        ctx.beginPath()
        ctx.strokeStyle="#00FF00"
        for(var i = 0; i < 4; i++){
            var y0 = i * y_step + border
            var x0 = border - 5
            var x1 = W + border + 5
            ctx.moveTo(x0, y0)
            ctx.lineTo(x1, y0)
            ctx.stroke()
        }

        // x solid grid
        for(var i = 0; i < keys.length; i++){
            x0 = keys[i][0] * x_step + border
            y0 = border
            y1 = H + border
            ctx.moveTo(x0, y0)
            ctx.lineTo(x0, y1)
            ctx.stroke()
        }
        ctx.closePath()

        // y axis
        ctx.fillStyle = "#000000"
        ctx.fillText("Intensity", 0, 0)
        intensities = new Array("None", "Weak", "Medium", "Intense")
        for(var i = 0; i < 4; i++){
            ctx.fillText(intensities[3 - i], border + W + 5, i * y_step + border + 4)
        }
        vals = new Array("0.000", "0.167", "0.333", "0.500", "0.667", "0.833", "1.000")
        for(var i = 0; i < 7; i++){
            ctx.fillText(vals[6 - i], 5, i * y_step / 2 + border + 4)
        }

        // x axis
        //ctx.textAlign="top"
        ctx.fillText("Frame", W + border + 5, H + border + 28)
        for(var i = 0; i < keys.length; i++){
            ctx.fillText(keys[i][0], keys[i][0] * x_step + border - 5, H + border + 12)
        }
        
        // draw pre scores points
        ctx.strokeStyle="#DDA0DD"
        ctx.setLineDash([])
        points = new Array()
        for(var i = 0; i < frame_cnt; i++){
            x0 = i * x_step + border
            y0 = (1.0 - scores[i]) * H + border
            points.push(new Array(x0, y0))
        }
        draw_curve(ctx, points, false)

        // draw pre smooth scores points
        ctx.strokeStyle="#00FFFF"
        points = new Array()
        for(var i = 0; i < frame_cnt; i++){
            x0 = i * x_step + border
            y0 = (1.0 - smooth_scores[i]) * H + border
            points.push(new Array(x0, y0))
        }
        draw_curve(ctx, points, false)

        // draw pick intensity(discrete)
        ctx.fillStyle="#FF0000"
        ctx.strokeStyle="#FF0000"
        points = new Array()
        for(var i = 0; i < frame_cnt; i++){
            x0 = i * x_step + border
            y0 = (1 - inter_scores[i]) * H + border
            points.push(new Array(x0, y0))
        }
        draw_curve(ctx, points, false)
        for(var i = 0; i < keys.length; i++){
            cur_ind = keys[i][0]
            x0 = cur_ind * x_step + border
            y0 = (1 - inter_scores[cur_ind]) * H + border
            draw_point(ctx, x0, y0)
        }

        // cur frame mark
        ctx.beginPath()
        ctx.strokeStyle="#0000FF"
        ctx.fillStyle="#0000FF"
        x0 = frame_id * x_step + border
        ctx.moveTo(x0, border)
        ctx.lineTo(x0, H + border)
        ctx.stroke()
        ctx.closePath()
        ctx.fillText(frame_id, frame_id * x_step + border - 3, border - 5)

        // note
        base_y = canvas.height - 15

        ctx.strokeStyle = "#DDA0DD"
        ctx.fillStyle="#DDA0DD"
        x0 = 200
        points = new Array(new Array(x0, base_y), new Array(x0 + 30, base_y))
        draw_curve(ctx, points, true)
        ctx.fillStyle="#000000"
        ctx.fillText("Prediction", x0 + 35, base_y + 4)

        ctx.strokeStyle = "#00FFFF"
        ctx.fillStyle="#00FFFF"
        x0 = 320
        points = new Array(new Array(x0, base_y), new Array(x0 + 30, base_y))
        draw_curve(ctx, points, true)
        ctx.fillStyle="#000000"
        ctx.fillText("Smooth Prediction", x0 + 35, base_y + 4)

        ctx.strokeStyle = "#FF0000"
        ctx.fillStyle="#FF0000"
        x0 = 480
        points = new Array(new Array(x0, base_y), new Array(x0 + 30, base_y))
        draw_curve(ctx, points, true)
        ctx.fillStyle="#000000"
        ctx.fillText("Annotation", x0 + 35, base_y + 4)

        ctx.strokeStyle = "#0000FF"
        ctx.fillStyle="#0000FF"
        x0 = 600
        points = new Array(new Array(x0, base_y), new Array(x0 + 30, base_y))
        draw_curve(ctx, points, true)
        ctx.fillStyle="#000000"
        ctx.fillText("Current Frame", x0 + 35, base_y + 4)
    }

    function pre_intensity(score){
        if(score < 0.167) return 0
        if(score < 0.5) return 1
        if(score < 0.833) return 2
        return 3
    }


    function add_key_frame(i, ind, intensity, node){
        node_no = "<td>" + i + "</td>"
        node_index = "<td>" + ind + "</td>"
        options = "<option value='0'>None</option> <option value='1'>Weak</option> <option value='2'>Medium</option> <option value='3'>Intense</option>"
        node_intensity = "<td><select id='select_" + ind + "'>" + options + "</select></td>"
        node_show = "<td><button id='show_" + ind + "'>Show</button></td>"
        node_delete = "<td><button id='delete_" + ind + "'>Delete</button></td>"

        if(node == null)
            $("#key_frames").append("<tr class='key_frame_item'>"+ node_no + node_index + node_intensity + node_show + node_delete + "</tr>")
        else{
            $(node).after("<tr class='key_frame_item'>"+ node_no + node_index + node_intensity + node_show + node_delete + "</tr>")
        }
        
        
        $("#select_" + ind).val(intensity)
        $("#show_" + ind).click(function(){
            jump_to_frame(ind)
        })
        $("#delete_" + ind).click(function(){
            trs = $(this).parent().parent().parent().children(".key_frame_item")
            // key frame after i no. should -1 
            for(var j = 0; j < trs.length; j++){
                tds = trs[j].children
                cur_ind = parseInt(tds[1].firstChild.data)
                if(cur_ind < ind) continue
                else if(cur_ind > ind) tds[0].firstChild.data -= 1
                else trs[j].remove()
            }
       })
    }

    function init_key_frames(smooth_scores, key_indexs){
        for(var i = 0; i < key_indexs.length; i++){
            ind = key_indexs[i]
            intensity = pre_intensity(smooth_scores[ind])
            add_key_frame(i + 1, ind, intensity, null)
        }
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
    function submit_label(sample_id, sample_cnt){
        $("#submit_info").empty()
        $("#submit_info").css({"color": "red"});
        var all_zero = true
        var values = ""
                    
        trs = $("#key_frames").find(".key_frame_item")
        //console.log(trs)
        // find the current index and get all keys values
        target = -1
        keys = new Array()
        for(var j = 0; j < trs.length; j++){
            ind = parseInt(trs[j].children[1].firstChild.data)
            label_intensity = parseInt($("#select_" + ind).val())
            values = values + ind + " " + label_intensity + " "
            if(label_intensity > 0) all_zero = false
        }
                        
        if(all_zero == true){
            $("#submit_info").html("Error: all label is 0!")
        }
        else{
            var usr_name = $("#info_input").val().replace(/\s*/g,"")
            if(usr_name == ""){
                $("#submit_info").html("Error: invalid name!")
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
                                sample_id += 1
                                window.location.href = "/" + sample_id + "?usr_name=" + usr_name 
                            }
                            else{
                                $("#submit_info").css({"color": "blue"});
                                $("#submit_info").html("Done! Thank you, " + usr_name + "　！")
                            }
                        }
                        else{
                            $("#submit_info").html("Error!")
                        }
                    }
                )
            }
        }
    }

})
