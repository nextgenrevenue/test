// grid.js - FINAL WORKING VERSION (স্ক্রোল ফিক্স সহ)
console.log("📦 grid.js লোড হচ্ছে...");

class RealTimeGridSystem {
  constructor(config) {
    console.log("🔧 Grid System Constructor কল হয়েছে");
    
    // ডিফল্ট কনফিগারেশন
    const defaultConfig = {
      firebase: null,
      db: null,
      gridContainerId: 'serialGrid',
      selectedSerialInputId: 'serialInput',
      dayElementId: 'day',
      timeElementId: 'time',
      typeElementId: 'patientType',
      pendingSelectionsCollection: 'pendingSelections',
      appointmentsCollection: 'appointments',
      settingsCollection: 'settings',
      serialRangesDocId: 'serialRanges',
      onSerialClick: null,
      onGridUpdate: null,
      onPendingUpdate: null,
      mode: 'user',
      adminSessionId: null,
      userPendingExpiry: 1 * 60 * 1000, // 1 minutes
      adminPendingExpiry: 5 * 60 * 1000, // 1 minutes
      enableRealTime: true,
      customFilters: {}
    };
    
    this.config = { ...defaultConfig, ...config };
    
    // ডাটা স্টোরেজ
    this.serialRanges = {};
    this.appointments = [];
    this.pendingSelections = {};
    this.userPendingId = null;
    this.currentSelection = null;
    this.realtimeListeners = [];
    this.currentUserPendingSerial = null; // ✅ বর্তমান ইউজারের পেন্ডিং সিরিয়াল ট্র্যাক
    
    console.log(`✅ Grid System তৈরি হয়েছে (${this.config.mode} মোড)`);
  }

  // ==================== CSS ইনজেকশন ====================
  injectStyles() {
    console.log("🎨 CSS স্টাইল ইনজেক্ট হচ্ছে...");
    
    if (document.getElementById('grid-system-styles')) {
      console.log("ℹ️ CSS ইতিমধ্যে ইনজেক্ট করা হয়েছে");
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'grid-system-styles';
    
    const css = `
      /* Grid System Styles */

      .available-dot { background-color: var(--success); }
      .booked-dot { background-color: var(--danger); }
      .selected-dot { background-color: var(--warning); }
      .pending-dot { background-color: var(--info); }

      .serial-grid {
        display: grid;
        grid-template-columns: repeat(10, 1fr);
        gap: 8px;
        margin: 10px 0;
        padding: 10px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        max-height: 300px;
        overflow-y: auto;
        background-color: white;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }
      
      .serial-item {
        padding: 10px;
        border: 2px solid transparent;
        border-radius: 6px;
        text-align: center;
        font-weight: 500;
        font-size: 14px;
        transition: all 0.2s ease;
        user-select: none;
        cursor: pointer;
        min-height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        outline: none;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      
      .serial-item:focus,
      .serial-item:active {
        outline: none !important;
        box-shadow: none !important;
      }
      
      /* সবুজ - খালি */
      .serial-item.available {
        background-color: #dcfce7;
      color: var(--success);
      border: 2px solid var(--success);
      }
      
      .serial-item.available:hover {
        background-color: #bbf7d0;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(34, 197, 94, 0.2);
      }
      
      /* লাল - বুকড */
      .serial-item.booked {
        background-color: #fecaca;
      color: var(--danger);
      border: 2px solid var(--danger);
      cursor: not-allowed;
      opacity: 0.8;
      }
      
      /* নীল - সিলেক্টেড (অন্য ইউজার) */
      .serial-item.pending {
        background-color: #dbeafe;
      color: var(--info);
      border: 2px solid var(--info);
      cursor: not-allowed;
      opacity: 0.7;
      }
      
      /* হলুদ - আপনার নির্বাচিত */
      .serial-item.selected {
        background-color: #fef3c7;
      color: var(--warning);
      border: 2px solid var(--warning);
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
      font-weight: 700;
      }
      
      /* এক্সপায়ার্ড */
      .serial-item.expired {
        background-color: #f3f4f6;
        color: #4b5563;
        border-color: #9ca3af;
        cursor: pointer;
      }
      
      .serial-item.expired:hover {
        background-color: #e5e7eb;
      }
      
      /* Responsive Design */
      @media (max-width: 1024px) {
        .serial-grid {
          grid-template-columns: repeat(7, 1fr);
        }
      }
      
      @media (max-width: 768px) {
        .serial-grid {
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }
        
        .serial-item {
          padding: 8px;
          font-size: 13px;
          min-height: 36px;
        }
      }
      
      @media (max-width: 480px) {
        .serial-grid {
          grid-template-columns: repeat(7, 1fr);
        }
        
        .serial-item {
          font-size: 12px;
          min-height: 32px;
        }
      }
      
      .grid-no-selection {
        grid-column: 1 / -1;
        text-align: center;
        padding: 20px;
        color: #6b7280;
        font-style: italic;
      }
      
      .grid-loading {
        grid-column: 1 / -1;
        text-align: center;
        padding: 30px;
        color: #3b82f6;
      }
    `;
    
    style.textContent = css;
    document.head.appendChild(style);
    console.log("✅ CSS সফলভাবে ইনজেক্ট হয়েছে");
  }

  // ==================== ইনিশিয়ালাইজেশন ====================
  async init() {
    console.log("🚀 Grid System ইনিশিয়ালাইজেশন শুরু...");
    
    try {
      // CSS ইনজেক্ট করুন
      this.injectStyles();
      
      // ডাটাবেজ চেক
      if (!this.config.db) {
        throw new Error('Firebase Firestore database is not available');
      }
      
      // ডাটা লোড করুন
      await this.loadSerialRanges();
      await this.loadAppointments();
      
      // রিয়েল-টাইম লিসেনার সেটআপ
      if (this.config.enableRealTime) {
        this.setupRealtimeListeners();
      }
      
      // ইভেন্ট লিসেনার সেটআপ
      this.setupEventListeners();
      
      // ✅ Event Delegation সেটআপ
      this.setupEventDelegation();
      
      console.log("✅ Grid System সফলভাবে ইনিশিয়ালাইজ হয়েছে");
      return true;
      
    } catch (error) {
      console.error("❌ Grid System ইনিশিয়ালাইজেশন ব্যর্থ:", error);
      return false;
    }
  }

  // ==================== ডাটা লোডিং ====================
  async loadSerialRanges() {
    if (!this.config.db) {
      console.error("❌ ডাটাবেজ নেই");
      return;
    }
    
    try {
      console.log("📊 সিরিয়াল রেঞ্জ লোড হচ্ছে...");
      
      const doc = await this.config.db
        .collection(this.config.settingsCollection)
        .doc(this.config.serialRangesDocId)
        .get();
      
      if (doc.exists) {
        this.serialRanges = doc.data();
        console.log("✅ সিরিয়াল রেঞ্জ লোড হয়েছে:", this.serialRanges);
      } else {
        console.log("ℹ️ কোনো সিরিয়াল রেঞ্জ পাওয়া যায়নি");
        this.serialRanges = {
          Thursday: { new: {}, old: {} },
          Friday: { new: {}, old: {} }
        };
      }
      
    } catch (error) {
      console.error("❌ সিরিয়াল রেঞ্জ লোড করতে সমস্যা:", error);
    }
  }

  async loadAppointments() {
    if (!this.config.db) return;
    
    try {
      console.log("📅 অ্যাপয়েন্টমেন্ট লোড হচ্ছে...");
      
      // শুধু ৪ দিনের ডাটা লোড করবে
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
      
      const snapshot = await this.config.db
        .collection(this.config.appointmentsCollection)
        .where('timestamp', '>=', fourDaysAgo)
        .get();
      
      this.appointments = [];
      snapshot.forEach(doc => {
        this.appointments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`✅ ${this.appointments.length} টি অ্যাপয়েন্টমেন্ট লোড হয়েছে (৪ দিনের মধ্যে)`);
      
    } catch (error) {
      console.error("❌ অ্যাপয়েন্টমেন্ট লোড করতে সমস্যা:", error);
    }
  }

  // ==================== রিয়েল-টাইম লিসেনার ====================
  setupRealtimeListeners() {
    if (!this.config.db) return;
    
    console.log("🔗 রিয়েল-টাইম লিসেনার সেটআপ হচ্ছে...");
    
    // শুধু ৪ দিনের ডাটা দেখাবে
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    
    // অ্যাপয়েন্টমেন্ট লিসেনার - শুধু ৪ দিনের ডাটা
    const appointmentsListener = this.config.db
      .collection(this.config.appointmentsCollection)
      .where('timestamp', '>=', fourDaysAgo)
      .onSnapshot(snapshot => {
        console.log("🔄 অ্যাপয়েন্টমেন্ট আপডেট পাওয়া গেছে");
        
        this.appointments = [];
        snapshot.forEach(doc => {
          this.appointments.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        this.updateGrid();
        
        if (this.config.onGridUpdate) {
          this.config.onGridUpdate('appointments', {
            count: this.appointments.length,
            data: this.appointments
          });
        }
      }, error => {
        console.error("❌ অ্যাপয়েন্টমেন্ট লিসেনার ত্রুটি:", error);
      });
    
    this.realtimeListeners.push(appointmentsListener);
    
    // পেন্ডিং সিলেকশন লিসেনার - শুধু একটিভ পেন্ডিং
    const pendingListener = this.config.db
      .collection(this.config.pendingSelectionsCollection)
      .where('expiresAt', '>', new Date())
      .onSnapshot(snapshot => {
        console.log("🔄 পেন্ডিং সিলেকশন আপডেট পাওয়া গেছে");
        
        this.processPendingSelections(snapshot);
        this.updateGrid();
        
        if (this.config.onPendingUpdate) {
          this.config.onPendingUpdate(this.pendingSelections);
        }
      }, error => {
        console.error("❌ পেন্ডিং সিলেকশন লিসেনার ত্রুটি:", error);
      });
    
    this.realtimeListeners.push(pendingListener);
  }

  processPendingSelections(snapshot) {
    this.pendingSelections = {};
    const now = new Date();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      if (data.expiresAt && data.expiresAt.toDate() > now) {
        const key = `${data.day}_${data.time}_${data.type}`;
        
        if (!this.pendingSelections[key]) {
          this.pendingSelections[key] = {
            user: [],
            admin: []
          };
        }
        
        if (data.bookedBy === 'user') {
          this.pendingSelections[key].user.push({
            serial: data.serial,
            id: doc.id,
            expiresAt: data.expiresAt
          });
          
          // ✅ যদি এটি বর্তমান ইউজারের পেন্ডিং হয়
          if (doc.id === this.userPendingId) {
            this.currentUserPendingSerial = data.serial;
          }
        } else if (data.bookedBy === 'admin') {
          this.pendingSelections[key].admin.push({
            serial: data.serial,
            id: doc.id,
            adminId: data.adminId,
            expiresAt: data.expiresAt
          });
        }
      }
    });
    
    console.log("📋 পেন্ডিং সিলেকশন প্রসেস করা হয়েছে");
  }

  // ==================== ইভেন্ট হ্যান্ডলিং ====================
  setupEventDelegation() {
    const gridContainer = document.getElementById(this.config.gridContainerId);
    if (!gridContainer) return;
    
    // পুরানো ইভেন্ট রিমুভ
    gridContainer.removeEventListener('click', this.handleGridClick.bind(this));
    
    // নতুন ইভেন্ট যোগ
    gridContainer.addEventListener('click', (e) => this.handleGridClick(e));
    
    console.log("🎯 ইভেন্ট ডেলিগেশন সেটআপ সম্পন্ন");
  }

  handleGridClick(event) {
    const serialItem = event.target.closest('.serial-item');
    if (!serialItem) return;
    
    // বুকড বা পেন্ডিং সিরিয়ালে ক্লিক করবেন না
    if (serialItem.classList.contains('booked') || 
        serialItem.classList.contains('pending')) {
      return;
    }
    
    const serial = parseInt(serialItem.dataset.serial);
    if (isNaN(serial)) return;
    
    console.log(`🎯 সিরিয়াল ${serial} ক্লিক করা হয়েছে`);
    
    // ✅ ফোকাস থেকে স্ক্রোল প্রতিরোধ
    setTimeout(() => {
      serialItem.blur();
      // সব সক্রিয় এলিমেন্টকে blur করুন
      const activeEl = document.activeElement;
      if (activeEl && activeEl.classList && activeEl.classList.contains('serial-item')) {
        activeEl.blur();
      }
    }, 0);
    
    // দ্রুত UI আপডেট
    serialItem.classList.remove('available', 'expired', 'selected');
    serialItem.classList.add('selected');
    serialItem.style.cursor = 'wait';
    
    // সিরিয়াল সিলেক্ট করুন
    this.selectSerial(serial).catch(error => {
      console.error("❌ সিরিয়াল সিলেক্টে সমস্যা:", error);
      this.updateGrid();
    });
    
    // ✅ ফোকাস ইভেন্ট লিসেনার যোগ করুন
    serialItem.addEventListener('focus', function(e) {
      e.target.blur();
    }, { once: true });
  }

  setupEventListeners() {
    console.log("🎯 ইভেন্ট লিসেনার সেটআপ হচ্ছে...");
    
    const elementsToWatch = [
      this.config.dayElementId,
      this.config.timeElementId,
      this.config.typeElementId
    ];
    
    elementsToWatch.forEach(elementId => {
      const element = document.getElementById(elementId);
      if (element) {
        element.addEventListener('change', () => {
          console.log(`${elementId} চেঞ্জ হয়েছে, গ্রিড আপডেট হচ্ছে...`);
          this.updateGrid();
        });
      }
    });
  }

  // ==================== ইউটিলিটি ফাংশন ====================
  getElementValue(elementId) {
    if (typeof elementId === 'function') {
      return elementId();
    }
    
    const element = document.getElementById(elementId);
    return element ? element.value : null;
  }

  getSerialRange(day, type, time) {
    if (this.serialRanges[day] && 
        this.serialRanges[day][type] && 
        this.serialRanges[day][type][time]) {
      return this.serialRanges[day][type][time];
    }
    return null;
  }

  // ✅ FIXED: সিরিয়াল স্ট্যাটাস ফাংশন
  getSerialStatus(serial, day, time, type, pendingData) {
    const status = {
      isBooked: false,
      isExpiredBooking: false,
      isOtherUserPending: false,
      isCurrentUserPending: false,
      isAdminPending: false,
      isCurrentAdminPending: false,
      tooltip: `সিরিয়াল: ${serial}`
    };
    
    // চেক করা বুকড কিনা
    const appointment = this.appointments.find(app => {
      const patientType = app.patientType || app.type;
      return app.day === day &&
             app.time === time &&
             patientType === type &&
             app.serial === serial;
    });
    
    if (appointment) {
      // চেক ৪ দিনের বেশি পুরানো কিনা
      if (appointment.timestamp && appointment.timestamp.toDate) {
        const appointmentDate = appointment.timestamp.toDate();
        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
        
        if (appointmentDate < fourDaysAgo) {
          status.isExpiredBooking = true;
          status.tooltip = 'এই সিরিয়ালটি ৪ দিনের বেশি পুরানো, আবার বুক করা যাবে';
        } else {
          status.isBooked = true;
          status.tooltip = 'ইতিমধ্যে বুক করা হয়েছে';
        }
      } else {
        status.isBooked = true;
        status.tooltip = 'ইতিমধ্যে বুক করা হয়েছে';
      }
    }
    
    // পেন্ডিং সিলেকশন চেক
    if (!status.isBooked && !status.isExpiredBooking) {
      // ✅ প্রথমে চেক করুন যদি এটি বর্তমান ইউজারের পেন্ডিং হয়
      if (this.currentUserPendingSerial === serial) {
        status.isCurrentUserPending = true;
        status.tooltip = 'আপনার নির্বাচিত (পেন্ডিং)';
      } 
      // ✅ অন্য ইউজারের পেন্ডিং চেক
      else if (pendingData.user && pendingData.user.some(p => p.serial === serial)) {
        status.isOtherUserPending = true;
        status.tooltip = 'অন্য ইউজার সিলেক্ট করেছেন (পেন্ডিং)';
      }
      
      // এডমিন পেন্ডিং চেক
      if (pendingData.admin && pendingData.admin.some(p => p.serial === serial)) {
        status.isAdminPending = true;
        
        if (this.config.mode === 'admin') {
          const adminPending = pendingData.admin.find(p => p.serial === serial);
          if (adminPending && adminPending.adminId === this.config.adminSessionId) {
            status.isCurrentAdminPending = true;
            status.tooltip = 'আপনার নির্বাচিত (পেন্ডিং)';
          } else {
            status.tooltip = 'অন্য এডমিন সিলেক্ট করেছেন';
          }
        }
      }
    }
    
    // খালি সিরিয়াল
    if (!status.isBooked && !status.isExpiredBooking && 
        !status.isOtherUserPending && !status.isCurrentUserPending && 
        !status.isAdminPending && !status.isCurrentAdminPending) {
      status.tooltip = 'খালি সিরিয়াল - ক্লিক করে নির্বাচন করুন';
    }
    
    return status;
  }

  // ==================== গ্রিড রেন্ডারিং ====================
  updateGrid() {
    console.log("🎯 গ্রিড আপডেট হচ্ছে...");
    
    const gridContainer = document.getElementById(this.config.gridContainerId);
    if (!gridContainer) {
      console.error(`❌ গ্রিড কনটেইনার পাওয়া যায়নি: ${this.config.gridContainerId}`);
      return;
    }
    
    const day = this.getElementValue(this.config.dayElementId);
    const time = this.getElementValue(this.config.timeElementId);
    const type = this.getElementValue(this.config.typeElementId);
    
    console.log("গ্রিড প্যারামিটার:", { day, time, type });
    
    // ভ্যালিডেশন
    if (!day || !time || !type) {
      gridContainer.innerHTML = '<div class="grid-no-selection">দিন, সময় এবং ধরন নির্বাচন করুন</div>';
      return;
    }
    
    const range = this.getSerialRange(day, type, time);
    if (!range) {
      gridContainer.innerHTML = '<div class="grid-no-selection">এই সময়ের জন্য সিরিয়াল উপলব্ধ নেই</div>';
      return;
    }
    
    const [start, end] = range;
    const key = `${day}_${time}_${type}`;
    const pendingData = this.pendingSelections[key] || { user: [], admin: [] };
    
    // লোডিং স্টেট
    gridContainer.innerHTML = '<div class="grid-loading">সিরিয়াল লোড হচ্ছে...</div>';
    
    // ছোট ডিলে
    setTimeout(() => {
      gridContainer.innerHTML = '';
      
      for (let serial = start; serial <= end; serial++) {
        const serialItem = document.createElement('div');
        serialItem.className = 'serial-item';
        serialItem.textContent = serial;
        serialItem.dataset.serial = serial;
        serialItem.setAttribute('tabindex', '-1'); // ✅ ট্যাব ফোকাস প্রতিরোধ
        
        // ✅ ফোকাস ইভেন্ট হ্যান্ডলার যোগ করুন
        serialItem.addEventListener('focus', function(e) {
          this.blur();
        });
        
        const status = this.getSerialStatus(serial, day, time, type, pendingData);
        
        // ✅ সঠিকভাবে স্ট্যাটাস অ্যাপ্লাই করুন
        if (status.isBooked) {
          serialItem.classList.add('booked');
          serialItem.style.cursor = 'not-allowed';
        } 
        else if (status.isExpiredBooking) {
          serialItem.classList.add('expired');
          serialItem.style.cursor = 'pointer';
        }
        else if (status.isCurrentUserPending || status.isCurrentAdminPending) {
          // ✅ শুধুমাত্র আপনার নিজের পেন্ডিং হলুদ হবে
          serialItem.classList.add('selected');
          serialItem.style.cursor = 'pointer';
        }
        else if (status.isOtherUserPending || status.isAdminPending) {
          // ✅ অন্য ইউজার/এডমিনের পেন্ডিং নীল হবে
          serialItem.classList.add('pending');
          serialItem.style.cursor = 'not-allowed';
        }
        else {
          serialItem.classList.add('available');
          serialItem.style.cursor = 'pointer';
        }
        
        serialItem.title = status.tooltip;
        gridContainer.appendChild(serialItem);
      }
      
      console.log(`✅ গ্রিড আপডেট হয়েছে: ${end - start + 1} টি সিরিয়াল`);
      
      if (this.config.onGridUpdate) {
        this.config.onGridUpdate('grid', { day, time, type, start, end });
      }
      
    }, 100);
  }

  // ==================== সিরিয়াল সিলেকশন ====================
  async selectSerial(serial) {
    console.log(`🎯 সিরিয়াল ${serial} সিলেক্ট করা হচ্ছে...`);
    
    const day = this.getElementValue(this.config.dayElementId);
    const time = this.getElementValue(this.config.timeElementId);
    const type = this.getElementValue(this.config.typeElementId);
    
    if (!day || !time || !type) {
      console.error("❌ সিরিয়াল সিলেক্ট করা যাবে না: দিন/সময়/ধরন নির্বাচন করুন");
      return;
    }
    
    // রেঞ্জ ভ্যালিডেশন
    const range = this.getSerialRange(day, type, time);
    if (!range) {
      console.error("❌ সিরিয়াল রেঞ্জ নেই");
      return;
    }
    
    const [start, end] = range;
    if (serial < start || serial > end) {
      console.error(`❌ সিরিয়াল ${serial} রেঞ্জের বাইরে (${start}-${end})`);
      return;
    }
    
    // চেক করা বুকড কিনা
    const appointment = this.appointments.find(app => {
      const patientType = app.patientType || app.type;
      return app.day === day &&
             app.time === time &&
             patientType === type &&
             app.serial === serial;
    });
    
    if (appointment) {
      let isExpired = false;
      if (appointment.timestamp && appointment.timestamp.toDate) {
        const appointmentDate = appointment.timestamp.toDate();
        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
        
        if (appointmentDate < fourDaysAgo) {
          isExpired = true;
        }
      }
      
      if (!isExpired) {
        console.log(`❌ সিরিয়াল ${serial} ইতিমধ্যে বুক করা হয়েছে`);
        
        if (this.config.onSerialClick) {
          this.config.onSerialClick({
            serial,
            day,
            time,
            type,
            status: 'booked',
            message: 'এই সিরিয়ালটি ইতিমধ্যে বুক করা হয়েছে'
          });
        }
        return;
      }
    }
    
    // আগের পেন্ডিং সিলেকশন রিমুভ
    if (this.userPendingId) {
      await this.removePendingSelection(this.userPendingId);
    }
    
    // নতুন পেন্ডিং সিলেকশন অ্যাড
    this.userPendingId = await this.addPendingSelection(serial, day, time, type);
    
    if (this.userPendingId) {
      this.currentSelection = serial;
      this.currentUserPendingSerial = serial; // ✅ বর্তমান ইউজারের সিরিয়াল ট্র্যাক করুন
      
      // সিলেক্টেড ইনপুট আপডেট
      const selectedInput = document.getElementById(this.config.selectedSerialInputId);
      if (selectedInput) {
        selectedInput.value = serial;
        // ✅ ইনপুট ফোকাস হলে স্ক্রোল হতে পারে, তাই blur করুন
        setTimeout(() => {
          selectedInput.blur();
        }, 10);
      }
      
      console.log(`✅ সিরিয়াল ${serial} সিলেক্ট হয়েছে, পেন্ডিং ID: ${this.userPendingId}`);
      
      // গ্রিড আপডেট
      this.updateGrid();
      
      // কলব্যাক কল
      if (this.config.onSerialClick) {
        this.config.onSerialClick({
          serial,
          day,
          time,
          type,
          status: 'pending',
          pendingId: this.userPendingId,
          message: 'সিরিয়াল সফলভাবে নির্বাচিত হয়েছে'
        });
      }
    }
  }

  async addPendingSelection(serial, day, time, type) {
    if (!this.config.db) {
      console.error("❌ ডাটাবেজ নেই");
      return null;
    }
    
    try {
      const pendingData = {
        serial: serial,
        day: day,
        time: time,
        type: type,
        bookedBy: this.config.mode,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + (
          this.config.mode === 'admin' ? 
          this.config.adminPendingExpiry : 
          this.config.userPendingExpiry
        ))
      };
      
      if (this.config.mode === 'admin') {
        pendingData.adminId = this.config.adminSessionId;
        pendingData.sessionId = this.config.adminSessionId;
      }
      
      const docRef = await this.config.db
        .collection(this.config.pendingSelectionsCollection)
        .add(pendingData);
      
      console.log(`📝 পেন্ডিং সিলেকশন অ্যাড করা হয়েছে: ${docRef.id}`);
      
      // ✅ বর্তমান ইউজারের সিরিয়াল সেট করুন
      this.currentUserPendingSerial = serial;
      
      return docRef.id;
      
    } catch (error) {
      console.error("❌ পেন্ডিং সিলেকশন অ্যাড করতে সমস্যা:", error);
      return null;
    }
  }

  async removePendingSelection(pendingId) {
    if (!this.config.db || !pendingId) return;
    
    try {
      await this.config.db
        .collection(this.config.pendingSelectionsCollection)
        .doc(pendingId)
        .delete();
      
      this.userPendingId = null;
      this.currentUserPendingSerial = null; // ✅ রিসেট করুন
      console.log(`✅ পেন্ডিং সিলেকশন রিমুভ হয়েছে: ${pendingId}`);
      
    } catch (error) {
      console.error("❌ পেন্ডিং সিলেকশন রিমুভ করতে সমস্যা:", error);
    }
  }

  // ==================== অতিরিক্ত মেথড ====================
  getAvailableSerials() {
    const day = this.getElementValue(this.config.dayElementId);
    const time = this.getElementValue(this.config.timeElementId);
    const type = this.getElementValue(this.config.typeElementId);
    const range = this.getSerialRange(day, type, time);
    
    if (!range) return [];
    
    const [start, end] = range;
    const available = [];
    
    for (let serial = start; serial <= end; serial++) {
      const key = `${day}_${time}_${type}`;
      const pendingData = this.pendingSelections[key] || { user: [], admin: [] };
      const status = this.getSerialStatus(serial, day, time, type, pendingData);
      
      if (!status.isBooked && !status.isOtherUserPending && !status.isAdminPending) {
        available.push(serial);
      }
    }
    
    return available;
  }

  forceUpdate() {
    this.updateGrid();
  }

  cleanup() {
    this.realtimeListeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    
    if (this.userPendingId) {
      this.removePendingSelection(this.userPendingId);
    }
    
    console.log("🧹 Grid System ক্লিনআপ সম্পন্ন");
  }
}

// গ্লোবাল এক্সপোর্ড
if (typeof window !== 'undefined') {
  window.RealTimeGridSystem = RealTimeGridSystem;
  console.log("✅ RealTimeGridSystem উইন্ডো অবজেক্টে রেজিস্টার হয়েছে");
}

console.log("📦 grid.js লোড সম্পন্ন");