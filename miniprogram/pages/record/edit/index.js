Page({
  data: {
    imagePaths: [],
    currentImageIndex: 0,
    user: '',
    avatar: '',
    mealTypes: ['早餐', '午餐', '下午茶', '晚餐', '夜宵', '零食', '嘴巴空空'],
    selectedType: '午餐',
    mealName: '',
    price: '',
    currencySymbol: '¥',
    recordId: '',
    isEdit: false,
    tempImagePaths: []
  },

  onLoad(options) {
    const { user, avatar } = options;
    const currencySymbol = user === 'Nora' ? '¥' : '€';
    
    this.setData({
      user,
      avatar,
      currencySymbol,
      recordId: options.id || '',
      isEdit: options.isEdit === 'true'
    });
    
    if (this.data.isEdit) {
      this.loadRecordDetail();
    }

    // 监听返回按钮事件
    wx.enableAlertBeforeUnload({
      message: '离开后已上传的图片将被删除，确定要离开吗？'
    });
  },

  async loadRecordDetail() {
    wx.showLoading({
      title: '加载中...'
    });

    try {
      const db = wx.cloud.database();
      const res = await db.collection('meal_records').doc(this.data.recordId).get();
      const record = res.data;

      // 从价格字符串中提取数字部分
      const priceNumber = record.price.replace(/[^0-9]/g, '');

      this.setData({
        selectedType: record.type,
        mealName: record.name,
        price: priceNumber,
        currencySymbol: record.price.startsWith('¥') ? '¥' : '€',
        imagePaths: record.images || [],
        currentImageIndex: 0
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

  onTypeChange(e) {
    this.setData({
      selectedType: this.data.mealTypes[e.detail.value]
    });
  },

  onNameInput(e) {
    this.setData({
      mealName: e.detail.value
    });
  },

  onPriceInput(e) {
    this.setData({
      price: e.detail.value
    });
  },

  chooseImages() {
    const remainCount = 3 - this.data.imagePaths.length;
    if (remainCount <= 0) {
      wx.showToast({
        title: '最多上传3张图片',
        icon: 'none'
      });
      return;
    }

    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      camera: 'back',
      success: (res) => {
        const tempFiles = res.tempFiles;
        this.uploadImages(tempFiles.map(file => file.tempFilePath));
      }
    });
  },

  async uploadImages(tempFilePaths) {
    wx.showLoading({ title: '上传中...' });
    try {
      const uploadTasks = tempFilePaths.map(filePath => 
        wx.cloud.uploadFile({
          cloudPath: `meal_photos/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`,
          filePath: filePath
        })
      );

      const uploadResults = await Promise.all(uploadTasks);
      const newImagePaths = uploadResults.map(result => result.fileID);

      this.setData({
        imagePaths: [...this.data.imagePaths, ...newImagePaths],
        tempImagePaths: [...this.data.tempImagePaths, ...newImagePaths]
      });

      wx.showToast({
        title: '上传成功',
        icon: 'success'
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

  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const imagePaths = [...this.data.imagePaths];
    imagePaths.splice(index, 1);
    this.setData({ 
      imagePaths,
      currentImageIndex: Math.min(this.data.currentImageIndex, imagePaths.length - 1)
    });
  },

  changeImage(e) {
    const direction = e.currentTarget.dataset.direction;
    let newIndex = this.data.currentImageIndex;
    
    if (direction === 'prev') {
      newIndex = Math.max(0, newIndex - 1);
    } else {
      newIndex = Math.min(this.data.imagePaths.length - 1, newIndex + 1);
    }
    
    this.setData({
      currentImageIndex: newIndex
    });
  },

  async saveRecord() {
    if (this.data.imagePaths.length === 0) {
      wx.showToast({
        title: '请至少上传一张图片',
        icon: 'none'
      });
      return;
    }

    // 表单验证
    if (!this.data.mealName.trim()) {
      wx.showToast({
        title: '请输入餐点名称',
        icon: 'none'
      });
      return;
    }

    if (!this.data.price.trim()) {
      wx.showToast({
        title: '请输入价格',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    try {
      const db = wx.cloud.database({
        env: 'repas-0gr1x5by6fb1c499'
      });
      
      const recordData = {
        name: this.data.mealName.trim(),
        type: this.data.selectedType,
        price: `${this.data.currencySymbol}${this.data.price}`,
        user: this.data.user,
        avatar: this.data.avatar,
        images: this.data.imagePaths,
        image: this.data.imagePaths[0]
      };

      let result;
      if (this.data.isEdit) {
        result = await db.collection('meal_records').doc(this.data.recordId).update({
          data: recordData
        });
      } else {
        recordData.createTime = db.serverDate();
        result = await db.collection('meal_records').add({
          data: recordData
        });
      }

      console.log('保存结果：', result);

      // 保存成功后清空临时图片记录
      this.setData({
        tempImagePaths: []
      });

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (err) {
      console.error('保存记录失败：', err);
      console.log('保存的数据：', {
        mealType: this.data.selectedType,
        mealName: this.data.mealName,
        price: this.data.price,
        user: this.data.user,
        recordId: this.data.recordId
      });
      
      wx.showToast({
        title: err.message || '保存失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      wx.hideLoading();
    }
  },

  handleBack() {
    if (this.data.tempImagePaths.length > 0) {
      wx.showModal({
        title: '确认离开',
        content: '离开后已上传的图片将被删除，确定要离开吗？',
        success: (res) => {
          if (res.confirm) {
            this.cleanupTempImages();
            wx.navigateBack();
          }
        }
      });
    } else {
      wx.navigateBack();
    }
  },

  async cleanupTempImages() {
    if (this.data.tempImagePaths.length > 0) {
      try {
        await wx.cloud.deleteFile({
          fileList: this.data.tempImagePaths
        });
        this.setData({
          tempImagePaths: []
        });
      } catch (err) {
        console.error('删除临时图片失败：', err);
      }
    }
  },

  onUnload() {
    // 页面卸载时清理临时图片
    this.cleanupTempImages();
  }
}); 