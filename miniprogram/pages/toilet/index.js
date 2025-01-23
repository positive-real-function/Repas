// pages/toilet/index.js
const { getCollection } = require('../../config/collections.js');
const db = wx.cloud.database();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 'Nora',
    tabs: ['Nora', 'Elie'],
    toiletRecords: [],
    avatars: {
      Nora: '/images/headphoto/Nora.jpeg',
      Elie: '/images/headphoto/Elie.jpeg'
    },
    openids: {
      Nora: 'oup1z5IWvTgiJitepm5-VMK9ysKw',
      Eile: 'oup1z5Dv4pTjk0iZKjg3BT63EH7g'
    },
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    calendarDays: [],
    weekStats: {
      days: 0,
      times: 0,
      score: 85
    },
    colorStats: [
      { color: 'brown', name: '咖色', count: 0 },
      { color: 'yellow', name: '黄褐色', count: 0 },
      { color: 'black', name: '黑色', count: 0 },
      { color: 'green', name: '绿色', count: 0 },
      { color: 'red', name: '红色', count: 0 },
      { color: 'grey', name: '灰白色', count: 0 }
    ],
    weekRecords: [],
    selectedDate: new Date(),
    selectedDateText: '今日',
    dayRecords: [],
    colorMap: {
      'brown': '咖色',
      'yellow': '黄褐色',
      'black': '黑色',
      'green': '绿色',
      'red': '红色',
      'grey': '灰白色'
    },
    allRecords: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 设置默认选中当日
    const today = new Date();
    this.setData({
      selectedDate: today,
      selectedDateText: '今日'
    }, () => {
      this.loadToiletRecords();
      this.generateCalendar();
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时都重新加载记录，但保持当前选中的日期
    this.loadToiletRecords();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  async onPullDownRefresh() {
    await this.loadToiletRecords();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 加载记录
  async loadToiletRecords() {
    wx.showLoading({ title: '加载中...' });
    
    try {
      console.log('正在加载所有记录');
      
      // 获取所有记录，不做用户过滤
      const { data } = await db.collection(getCollection('TOILET'))
        .orderBy('createTime', 'desc')
        .get();

      console.log('获取到的所有记录:', data);
      
      // 根据当前选中的用户过滤记录
      const currentUserRecords = data.filter(record => record.user === this.data.currentTab);
      console.log('当前用户的记录:', currentUserRecords);
      
      // 更新记录列表
      this.setData({ 
        toiletRecords: currentUserRecords,  // 只显示当前用户的记录
        allRecords: data  // 保存所有记录
      }, () => {
        this.updateWeekStats(currentUserRecords);
        this.generateCalendar();
        this.updateDayRecords();
      });
      
    } catch (err) {
      console.error('加载记录失败：', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 切换tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    console.log('切换到用户:', tab);
    
    this.setData({
      currentTab: tab,
      // 切换用户时重置选中日期为今天
      selectedDate: new Date(),
      selectedDateText: '今日'
    }, () => {
      // 从所有记录中过滤出当前用户的记录
      if (this.data.allRecords) {
        const currentUserRecords = this.data.allRecords.filter(record => record.user === tab);
        this.setData({
          toiletRecords: currentUserRecords
        }, () => {
          this.updateWeekStats(currentUserRecords);
          this.generateCalendar();
          this.updateDayRecords();
        });
      }
    });
  },

  // 添加记录
  addRecord() {
    wx.navigateTo({
      url: `/pages/toilet/add/index?user=${this.data.currentTab}`
    });
  },

  prevMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 1) {
      currentMonth = 12;
      currentYear -= 1;
    } else {
      currentMonth -= 1;
    }
    this.setData({ currentYear, currentMonth });
    this.generateCalendar();
  },

  nextMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 12) {
      currentMonth = 1;
      currentYear += 1;
    } else {
      currentMonth += 1;
    }
    this.setData({ currentYear, currentMonth });
    this.generateCalendar();
  },

  generateCalendar() {
    const { currentYear, currentMonth } = this.data;
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const lastDate = new Date(currentYear, currentMonth, 0).getDate();
    
    let days = [];
    let week = [];
    
    // 填充上个月的日期
    const prevMonthLastDate = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const prevDate = new Date(currentYear, currentMonth - 2, prevMonthLastDate - i);
      week.push({
        day: prevMonthLastDate - i,
        isCurrentMonth: false,
        hasRecord: false,
        fullDate: prevDate.toISOString()  // 存储为ISO字符串
      });
    }
    
    // 填充当前月的日期
    for (let i = 1; i <= lastDate; i++) {
      if (week.length === 7) {
        days.push(week);
        week = [];
      }
      const currentDate = new Date(currentYear, currentMonth - 1, i);
      week.push({
        day: i,
        isCurrentMonth: true,
        hasRecord: this.checkHasRecord(currentDate),
        fullDate: currentDate.toISOString(),  // 存储为ISO字符串
        isSelected: this.isSameDate(currentDate, this.data.selectedDate)
      });
    }
    
    // 填充下个月的日期
    let nextMonthDay = 1;
    while (week.length < 7) {
      const nextDate = new Date(currentYear, currentMonth, nextMonthDay);
      week.push({
        day: nextMonthDay++,
        isCurrentMonth: false,
        hasRecord: false,
        fullDate: nextDate.toISOString()  // 存储为ISO字符串
      });
    }
    days.push(week);
    
    // 确保日历显示6周
    while (days.length < 6) {
      week = [];
      for (let i = 0; i < 7; i++) {
        const nextDate = new Date(currentYear, currentMonth, nextMonthDay);
        week.push({
          day: nextMonthDay++,
          isCurrentMonth: false,
          hasRecord: false,
          fullDate: nextDate.toISOString()  // 存储为ISO字符串
        });
      }
      days.push(week);
    }
    
    this.setData({ calendarDays: days });
  },

  checkHasRecord(date) {
    if (!Array.isArray(this.data.toiletRecords)) {
      return false;
    }
    
    return this.data.toiletRecords.some(record => {
      try {
        const recordDate = new Date(record.createTime);
        return this.isSameDate(recordDate, date) && 
               record.user === this.data.currentTab;  // 使用用户名来判断
      } catch (err) {
        console.error('日期比较错误:', err);
        return false;
      }
    });
  },

  updateWeekStats(records) {
    if (!Array.isArray(records)) {
      console.error('records不是数组:', records);
      return;
    }

    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    
    // 获取本周记录
    const weekRecords = records.filter(record => {
      try {
        const recordDate = new Date(record.createTime);
        return recordDate >= weekStart;
      } catch (err) {
        console.error('日期处理错误:', err);
        return false;
      }
    });

    // 如果本周没有记录，设置默认分数
    if (weekRecords.length === 0) {
      this.setData({
        weekStats: {
          days: 0,
          times: 0,
          score: 0
        },
        colorStats: this.data.colorStats.map(stat => ({...stat, count: 0})),
        weekRecords: []
      });
      return;
    }

    // 1. 计算每条记录的基础得分（满分100）
    const recordScores = weekRecords.map(record => {
      let recordScore = 0;

      // 1.1 颜色评分 (占35分)
      const colorScores = {
        'brown': 35,    // 咖色最健康
        'yellow': 30,   // 黄褐色次之
        'black': 15,    // 黑色可能有问题
        'green': 10,    // 绿色可能消化不良
        'red': 0,       // 红色可能有出血
        'grey': 10      // 灰白色可能消化不良
      };
      recordScore += colorScores[record.color] || 0;

      // 1.2 形状评分 (占35分)
      const shapeScores = {
        '香蕉': 35,      // 最理想的形状
        '软状条状': 30,   // 次理想的形状
        '软稀糊': 20,     // 可能有轻微问题
        '颗粒': 15,      // 可能消化不良
        '水样便便': 10    // 腹泻
      };
      recordScore += shapeScores[record.shape] || 0;

      // 1.3 时长评分 (占30分)
      const durationInMinutes = record.duration / (1000 * 60);
      if (durationInMinutes >= 1 && durationInMinutes <= 5) {
        recordScore += 30;  // 理想时长
      } else if (durationInMinutes < 1) {
        recordScore += 15;  // 太快
      } else {
        recordScore += 10;  // 太久
      }

      return recordScore;
    });

    // 2. 计算记录的平均质量分（占70%）
    const avgQualityScore = recordScores.reduce((sum, score) => sum + score, 0) / weekRecords.length;
    
    // 3. 计算频率得分（占30%）
    const days = new Set(weekRecords.map(r => 
      new Date(r.createTime).toDateString()
    )).size;
    const avgTimesPerDay = weekRecords.length / Math.max(days, 1);
    let frequencyScore = 0;

    if (avgTimesPerDay >= 1 && avgTimesPerDay <= 3) {
      frequencyScore = 100;  // 理想频率
    } else {
      frequencyScore = 50;   // 不理想频率（太多或太少）
    }

    // 4. 计算最终得分（质量分70% + 频率分30%）
    const finalScore = Math.round((avgQualityScore * 0.7) + (frequencyScore * 0.3));

    // 统计颜色
    const colorCounts = {};
    weekRecords.forEach(record => {
      if (record.color) {
        colorCounts[record.color] = (colorCounts[record.color] || 0) + 1;
      }
    });
    
    const colorStats = this.data.colorStats.map(stat => ({
      ...stat,
      count: colorCounts[stat.color] || 0
    }));
    
    // 更新状态
    this.setData({
      weekStats: {
        days: days,
        times: weekRecords.length,
        score: finalScore
      },
      colorStats,
      weekRecords
    });

    console.log('本周状态评分:', {
      记录质量平均分: avgQualityScore,
      频率得分: frequencyScore,
      最终得分: finalScore,
      排便天数: days,
      平均每天次数: avgTimesPerDay,
      各记录得分: recordScores,
      记录数: weekRecords.length
    });
  },

  // 选择日期
  selectDate(e) {
    const dateStr = e.currentTarget.dataset.date;
    console.log('选择的日期字符串:', dateStr);
    
    const date = new Date(dateStr);
    console.log('转换后的日期对象:', date);
    
    if (isNaN(date.getTime())) {
      console.error('无效的日期:', dateStr);
      return;
    }
    
    // 更新选中日期
    this.setData({
      selectedDate: date,
      selectedDateText: this.formatDateText(date)
    }, () => {
      // 在回调中更新日历和记录
      this.generateCalendar();
      this.updateDayRecords();
    });
  },

  // 格式化日期文本
  formatDateText(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '今日';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨日';
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日`;
    }
  },

  // 更新日记录
  updateDayRecords() {
    if (!Array.isArray(this.data.toiletRecords)) return;
    
    const dayRecords = this.data.toiletRecords.filter(record => {
      try {
        const recordDate = new Date(record.createTime);
        const result = this.isSameDate(recordDate, this.data.selectedDate);
        return result;
      } catch (err) {
        console.error('日期比较错误:', err);
        return false;
      }
    }).map(record => ({
      ...record,
      color: this.data.colorMap[record.color] || record.color // 转换颜色为中文
    }));
    
    this.setData({ dayRecords });
  },

  // 判断是否同一天
  isSameDate(date1, date2) {
    try {
      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
    } catch (err) {
      console.error('日期比较出错:', err);
      return false;
    }
  }
})