// QQ音乐参考案例：http://zxt_team.gitee.io/qq-music-player/
// 解决click事件300ms延迟的问题
FastClick.attach(document.body);//这里加一个分号，要不会以为下面的闭包和这一行是一体的，或者下面的闭包不用小括号包起来，用加号或者波浪线

(async function () {
  const baseBox = document.querySelector(".header-box .base"),
    playerButton = document.querySelector(".player-button")
  wrapperBox = document.querySelector(".wrapper")
  footerBox = document.querySelector(".footer-box")
  currentBox = footerBox.querySelector(".current")
  durationBox = footerBox.querySelector(".duration")
  alreadyBox = footerBox.querySelector(".already")
  markImageBox = document.querySelector(".mark-image")
  loadingBox = document.querySelector(".loading-box")
  audioBox = document.querySelector("#audioBox")

  /* 这里定义的都是全局变量 */
  let wrapperList = []//用来存放所有的p标签，没有绑定之前是个空数组，绑定后才可以获取里面的p标签
  let timer = null,
    matchNum = 0//记录匹配的p标签的历史数量，其是控制歌词移动的

  /* 音乐控制 */
  const format = function format(time) {//time是传过来的秒数
    let minutes = Math.floor(time / 60),
      seconds = Math.round(time - minutes * 60)
    minutes = minutes < 10 ? "0" + minutes : "" + minutes
    seconds = seconds < 10 ? "0" + seconds : "" + seconds
    return {
      minutes,
      seconds
    }
  }

  //播放结束的时候做什么
  const playend = function playend() {
    clearInterval(timer)
    timer = null
    currentBox.innerHTML = "00 00"
    alreadyBox.style.width = '0%'
    wrapperBox.style.transform = 'translateY(0)'//歌词回到最开始
    wrapperList.forEach(item => item.className = '')//选中样式都去掉
    matchNum = 0//历史匹配数量控制歌词移动的
    playerButton.className = 'player-button'
  }
  const handle = function handle() {
    let pH = wrapperList[0].offsetHeight//不用管，只是为了读写分离
    let { currentTime, duration } = audioBox
    if (isNaN(currentTime) || isNaN(duration)) return
    //播放结束
    if (currentTime >= duration) {
      playend()
      return
    }

    //控制进度条
    let { minutes: currentTimeMinutes, seconds: currentTimeSeconds } = format(currentTime)//拿到当前播放时间的分和秒
    let { minutes: durationMinutes, seconds: durationSeconds } = format(duration)//拿到总时间的分和秒
    let ratio = Math.round(currentTime / duration * 100)
    currentBox.innerHTML = `${currentTimeMinutes}:${currentTimeSeconds}`
    durationBox.innerHTML = `${durationMinutes}:${durationSeconds}`
    alreadyBox.style.width = `${ratio}%`//控制进度条动

    //控制歌词动
    let matchs = wrapperList.filter(item => {//把每个p标签上存的自定义属性 和 currentTimeMinutes 对比 看是否一样
      let minutes = item.getAttribute('minutes'),
        seconds = item.getAttribute('seconds')
      return minutes === currentTimeMinutes && seconds === currentTimeSeconds
    })
    if (matchs.length > 0) {
      //说明找到匹配的了，让匹配的p标签有选中样式，其余的移出选中样式，先把所有的都移出，然后再把当前匹配的有样式
      wrapperList.forEach(item => item.className = '')
      matchs.forEach(item => item.className = 'active')

      //控制歌词移动
      matchNum += matchs.length
      if (matchNum > 3) {
        let offset = (matchNum - 3) * pH//计算向上移动多少位置
        wrapperBox.style.transform = `translateY(${-offset}px)`
      }


    }

  }

  /* 点击按钮控制音乐的播放和暂停 */
  playerButton.addEventListener('click', function () {
    if (audioBox.paused) {
      //当前是暂停的，我们让其播放
      audioBox.play()
      playerButton.classList.add('move')//播放的时候让按钮跟着转
      // playerButton.className="player-button move"
      handle()
      if (!timer) timer = setInterval(handle, 1000)
      return
    }
    //当前是播放的，我们让其暂停
    audioBox.pause()
    playerButton.classList.remove('move')
    // playerButton.className="player-button"
    clearInterval(timer)//暂停的时候清除定时器
    timer = null
  })




  /* 绑定数据 */
  const bindLyric = function bindLyric(lyric) {//把歌词传给我

    //处理歌词部分的特殊符号,这样歌词的中间就没有特殊符号了
    lyric = lyric.replace(/&#(\d+);/g, (value, $1) => {
      let instead = value
      switch (+$1) {
        case 32:
          instead = ""
          break;
        case 40:
          instead = "("
          break;
        case 41:
          instead = ")"
          break;
        case 45:
          instead = "-"
          break;
        default:

      }
      return instead
    })
    //解析歌词信息
    let arr = []
    lyric.replace(/\[(\d+):(\d+).(?:\d+)\](.+)\n/g, (_, $1, $2, $3) => {
      arr.push({
          minutes: $1,
          seconds: $2,
          text: $3.trim()
      })
  })
    //歌词绑定
    let str = ``
    arr.forEach(({ minutes, seconds, text }) => {
      //绑定歌词的时候给p标签加属性!!!!!!! 
      str += `<p minutes="${minutes}" seconds="${seconds}">
${text}</p>`
    })
    wrapperBox.innerHTML = str
    //获取wrapperBox里面的所有p标签,通过querySelectorAll获取的是类数组，转为数组
    wrapperList = Array.from(wrapperBox.querySelectorAll('p'))



  }

  const binding = function binding(data) {//把服务器获取的数据通过data给我。什么时候执行binding方法，获取数据后，执行的时候把data数据传过来
    let { title, author, duration, pic, audio, lyric } = data
    //@1绑定头部基本信息
    baseBox.innerHTML = `
        <div class="cover">
                            <img src="${pic}" alt="">
                        </div>
                        <div class="info">
                            <h2 class="title">${title}</h2>
                            <h3 class="author">${author}</h3>
                        </div>
`
    //@2绑定杂七杂八的
    durationBox.innerHTML = duration//音乐总时长
    markImageBox.style.backgroundImage = `url(${pic})`
    audioBox.src = audio
    
    //@3绑定歌词信息(这个麻烦，拿到的歌词有很多符号，需要分析歌词之后再绑定歌词)
    bindLyric(lyric)

    //@4关闭loading效果
    loadingBox.style.display = 'none'//当绑定完所有数据后让loading隐藏
  }

  // 向服务器发请求获取数据
  try {
    let { code, data } = await API.queryLyric()
    if (+code === 0) {
      binding(data)
      return
    }
  } catch (_) { }
  //请求失败
  alert('网路繁忙，请刷新页面')



})()