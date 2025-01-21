// pages/record/index.js
Page({
  data: {
    currentTab: 'Nora',
    tabs: ['Nora', 'Eile'],
    mealRecords: [],
    currentDate: new Date().getTime(),
    timezones: {
      Nora: 'UTC+8',
      Eile: 'UTC+1'
    },
    avatars: {
      Nora: '/images/headphoto/Nora.jpeg',
      Eile: '/images/headphoto/Elie.jpeg'
    },
    showActionSheet: false,
    currentMeal: null,
    currentDateIndex: null,
    currentMealIndex: null,
    scaleIndex: -1,
    scaleMealId: null,
    lastTapTime: 0,
    heartImages: {
      outline: 'cloud://repas-0gr1x5by6fb1c499.7265-repas-0gr1x5by6fb1c499-1331787762/images/icons/heart-outline.png',
      filled: 'cloud://repas-0gr1x5by6fb1c499.7265-repas-0gr1x5by6fb1c499-1331787762/images/icons/heart-filled.png'
    }
  },

  onLoad() {
    this.loadMealRecords();
    this.setCurrentTime();
    setInterval(() => {
      this.setCurrentTime();
    }, 60000);
  },

  onShow() {
    this.loadMealRecords();
    this.setCurrentTime();  // 页面显示时更新时间
  },

  // 加载餐点记录
  async loadMealRecords() {
    wx.showLoading({ title: '加载中...' });
    try {
      if (!wx.cloud) {
        throw new Error('云开发未初始化');
      }
      
      const db = wx.cloud.database();
      const _ = db.command;
      
      const { data } = await db.collection('meal_records')
        .where({
          user: this.data.currentTab
        })
        .orderBy('createTime', 'desc')
        .get();
      
      if (!data || data.length === 0) {
        this.setData({
          mealRecords: []
        });
        return;
      }
      
      const groupedData = this.groupRecordsByDate(data);
      
      this.setData({
        mealRecords: groupedData
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

  // 按日期分组记录
  groupRecordsByDate(records) {
    const groups = {};
    
    records.forEach(record => {
      const date = new Date(record.createTime);
      const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      
      if (!groups[dateStr]) {
        groups[dateStr] = {
          date: dateStr,
          meals: []
        };
      }
      
      groups[dateStr].meals.push(record);
    });
    
    return Object.values(groups).sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    }, () => {
      this.loadMealRecords();
      this.setCurrentTime();  // 切换标签页后立即更新时间
    });
  },

  // 设置当前时间
  setCurrentTime() {
    const now = new Date();
    const timezone = this.data.timezones[this.data.currentTab];
    let hours, minutes;
    
    // 获取UTC时间
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    
    // 根据不同时区计算时间
    if (timezone === 'UTC+8') {  // 北京时间
      hours = (utcHours + 8) % 24;
    } else if (timezone === 'UTC+1') {  // 巴黎时间
      hours = (utcHours + 1) % 24;
    }
    
    if (hours < 0) hours += 24;
    
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = utcMinutes.toString().padStart(2, '0');
    
    this.setData({
      currentTime: `${hoursStr}:${minutesStr}`
    });
  },

  // 添加新记录
  addNewRecord() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.uploadImage(tempFilePath);
      }
    });
  },

  // 上传图片
  async uploadImage(tempFilePath) {
    wx.showLoading({ title: '上传中...' });
    try {
      const result = await wx.cloud.uploadFile({
        cloudPath: `meal_photos/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`,
        filePath: tempFilePath
      });
      
      wx.navigateTo({
        url: `/pages/record/edit/index?imagePath=${result.fileID}&user=${this.data.currentTab}&avatar=${this.data.avatars[this.data.currentTab]}`
      });
    } catch (err) {
      console.error('上传失败：', err);
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 预览图片
  previewImage(e) {
    const { image } = e.currentTarget.dataset;
    wx.previewImage({
      urls: [image],
      current: image
    });
  },

  showActionSheet(e) {
    const meal = e.currentTarget.dataset.meal;
    // 还原缩放效果
    this.setData({
      scaleMealId: null
    });
    
    wx.showActionSheet({
      itemList: ['修改', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 修改
          wx.navigateTo({
            url: `/pages/record/edit/index?id=${meal._id}&imagePath=${meal.image}&user=${meal.user}&avatar=${meal.avatar}&isEdit=true`
          });
        } else if (res.tapIndex === 1) {
          // 删除
          wx.showModal({
            title: '确认删除',
            content: '确定要删除这条记录吗？',
            success: async (res) => {
              if (res.confirm) {
                wx.showLoading({
                  title: '删除中...'
                });

                try {
                  const db = wx.cloud.database();
                  // 删除数据库记录
                  await db.collection('meal_records').doc(meal._id).remove();
                  
                  // 删除云存储中的图片
                  if (meal.image) {
                    await wx.cloud.deleteFile({
                      fileList: [meal.image]
                    });
                  }

                  wx.showToast({
                    title: '删除成功',
                    icon: 'success'
                  });

                  // 重新加载列表
                  this.loadMealRecords();
                } catch (err) {
                  console.error('删除记录失败：', err);
                  wx.showToast({
                    title: '删除失败',
                    icon: 'none'
                  });
                } finally {
                  wx.hideLoading();
                }
              }
            }
          });
        }
      }
    });
  },

  onItemLongPress: function(e) {
    const meal = e.currentTarget.dataset.meal;
    
    this.setData({
      scaleMealId: meal._id
    });

    setTimeout(() => {
      this.showActionSheet(e);
    }, 150);
  },

  onItemTouchEnd: function() {
    this.setData({
      scaleMealId: null
    });
  },

  async handleHeartTap(e) {
    const { meal, dateIndex, mealIndex } = e.currentTarget.dataset;
    await this.toggleLikeStatus(meal, dateIndex, mealIndex);
  },

  async toggleLikeStatus(meal, dateIndex, mealIndex) {
    try {
      const db = wx.cloud.database();
      const newLikedStatus = !meal.liked;
      
      // 更新数据库
      await db.collection('meal_records').doc(meal._id).update({
        data: {
          liked: newLikedStatus
        }
      });

      // 更新本地数据
      const mealRecords = [...this.data.mealRecords];
      mealRecords[dateIndex].meals[mealIndex].liked = newLikedStatus;
      
      this.setData({
        mealRecords: mealRecords
      });

      // 显示提示
      wx.showToast({
        title: newLikedStatus ? '已添加喜欢' : '已取消喜欢',
        icon: 'none'
      });
      
    } catch (err) {
      console.error('更新点赞状态失败：', err);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  }
});