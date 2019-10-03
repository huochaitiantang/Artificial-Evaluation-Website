$(document).ready(function(){
    var pathname = window.location.pathname
    var emotion_id = pathname.split('/')[2]
    init_display(emotion_id)

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
    function init_display(emotion_id){
        var p = get_promise('/refer_init/' + emotion_id)
        p.then(
            (res) => {
                ans = JSON.parse(res)
                console.log(ans)
                emotion_id = ans['emotion_id']
                all_frames_paths = ans['frames_paths']
                display_w = ans['display_w']
                emotion_names = ans['emotion_names']
                display_nav(emotion_names, emotion_id)
                display_sample(all_frames_paths, display_w)
                $("#emotion").html(emotion_names[emotion_id])
            }
        )
    }

    // display emotion navgator
    function display_nav(emotion_names, emotion_id){
        for(var i = 1; i < emotion_names.length; i++){
            $("#nav").append("<a class='nav_a' id='refer_" + i + "' href='/refer/" + i + "'>" + i + "." + emotion_names[i] + "</a>")
        }
        $("#refer_" + emotion_id).css("background-color", "#00ff00")
    }

    // display a sample with all key frames
    function display_sample(all_frames_paths, display_w){
        //for(i = 0; i < all_frames_paths.length; i++){
        for(var i = 0; i < all_frames_paths.length; i++){
            $("#content_div").append(display_one_line(i, all_frames_paths[i], display_w, i == 0))
        }
    }

    // display one line
    function display_one_line(index, frame_paths, display_w, first_line){
        // frame order
        var node_string = "<div style='padding:10px;'><div style='display:inline-block;vertical-align:top;margin-right:10px;font-size:20px;font-style:italic;'>#" + format_number(index + 1, 3) + "</div>"
        // frames no, weak , mid, strong
        intensities = new Array("无", "弱", "中", "强")
        for(var i = 0; i < frame_paths.length; i++){
            if(first_line){
                node_string += "<div style='display:inline-block;vertical-align:top;margin-right:10px;'><div class='headline'><b>" + intensities[i]+ "</b></div><img src='/" + frame_paths[i] + "' width='" + display_w + "px'></div>"
            }
            else{
                node_string += "<div style='display:inline-block;vertical-align:top;margin-right:10px;'><img src='/" + frame_paths[i] + "' width='" + display_w + "px'></div>"
            }
        }
        node_string += "</div>"
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

})
