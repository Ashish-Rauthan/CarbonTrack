# python_app/app.py

import sys
import webbrowser
from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QPushButton,
    QLineEdit, QLabel, QMessageBox, QComboBox, QTabWidget,
    QTextEdit, QHBoxLayout, QGroupBox, QScrollArea, QGridLayout,
    QSpinBox, QDoubleSpinBox, QTableWidget, QTableWidgetItem,
    QHeaderView, QProgressBar
)
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QFont
from auth import login
from tracker import TrackerSession
from cloud_service import CloudService
from config import DASHBOARD_URL, ENABLE_CLOUD_FEATURES, validate_cloud_config

class LoginWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Carbon Tracker - Login")
        self.resize(400, 300)
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout()

        # Title
        self.title = QLabel("🌍 Carbon Tracker Login")
        title_font = QFont()
        title_font.setPointSize(18)
        title_font.setBold(True)
        self.title.setFont(title_font)
        self.title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        # Subtitle
        subtitle = QLabel("Track and optimize your carbon footprint")
        subtitle.setAlignment(Qt.AlignmentFlag.AlignCenter)
        subtitle.setStyleSheet("color: #666; margin-bottom: 20px;")
        
        # Email input
        self.email_input = QLineEdit()
        self.email_input.setPlaceholderText("Email")
        self.email_input.setStyleSheet("padding: 10px; font-size: 14px;")
        
        # Password input
        self.pass_input = QLineEdit()
        self.pass_input.setEchoMode(QLineEdit.EchoMode.Password)
        self.pass_input.setPlaceholderText("Password")
        self.pass_input.setStyleSheet("padding: 10px; font-size: 14px;")
        
        # Login button
        self.login_btn = QPushButton("Login")
        self.login_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                padding: 10px;
                font-size: 14px;
                font-weight: bold;
                border: none;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QPushButton:pressed {
                background-color: #3d8b40;
            }
        """)
        
        # Signup link
        self.signup_link = QPushButton("Create Account (Website)")
        self.signup_link.setStyleSheet("""
            QPushButton {
                background-color: transparent;
                color: #4CAF50;
                padding: 10px;
                border: 1px solid #4CAF50;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #f0f0f0;
            }
        """)

        # Add widgets to layout
        layout.addWidget(self.title)
        layout.addWidget(subtitle)
        layout.addSpacing(20)
        layout.addWidget(QLabel("Email:"))
        layout.addWidget(self.email_input)
        layout.addWidget(QLabel("Password:"))
        layout.addWidget(self.pass_input)
        layout.addSpacing(10)
        layout.addWidget(self.login_btn)
        layout.addWidget(self.signup_link)
        layout.addStretch()

        self.setLayout(layout)

        # Connect signals
        self.login_btn.clicked.connect(self.do_login)
        self.signup_link.clicked.connect(lambda: webbrowser.open(DASHBOARD_URL))
        self.pass_input.returnPressed.connect(self.do_login)

    def do_login(self):
        email = self.email_input.text().strip()
        password = self.pass_input.text().strip()
        
        if not email or not password:
            QMessageBox.warning(self, "Login Failed", "Please enter both email and password")
            return
            
        self.login_btn.setEnabled(False)
        self.login_btn.setText("Logging in...")
        
        token = login(email, password)
        
        if token:
            self.hide()
            self.tracker_window = TrackerWindow(token, email)
            self.tracker_window.show()
        else:
            QMessageBox.warning(self, "Login Failed", "Invalid credentials. Please try again.")
            self.login_btn.setEnabled(True)
            self.login_btn.setText("Login")


class TrackerWindow(QWidget):
    def __init__(self, token, user_id):
        super().__init__()
        self.setWindowTitle("Carbon Tracker Dashboard")
        self.resize(900, 700)
        self.token = token
        self.user_id = user_id
        self.tracker = None
        self.cloud_service = CloudService(token)
        self.regions_data = {}
        self.savings_data = None
        self.active_instances = []
        
        # Check cloud configuration
        self.cloud_config = validate_cloud_config()
        
        self.setup_ui()
        
        # Auto-refresh timer for instances
        self.refresh_timer = QTimer()
        self.refresh_timer.timeout.connect(self.refresh_instances)
        self.refresh_timer.start(30000)  # Refresh every 30 seconds

    def setup_ui(self):
        main_layout = QVBoxLayout()
        
        # Header
        header = QLabel("🌍 Carbon Tracker Dashboard")
        header_font = QFont()
        header_font.setPointSize(16)
        header_font.setBold(True)
        header.setFont(header_font)
        header.setAlignment(Qt.AlignmentFlag.AlignCenter)
        header.setStyleSheet("padding: 10px; background-color: #4CAF50; color: white;")
        main_layout.addWidget(header)
        
        # Create tab widget
        self.tabs = QTabWidget()
        self.tabs.setStyleSheet("""
            QTabWidget::pane {
                border: 1px solid #ccc;
                border-radius: 5px;
            }
            QTabBar::tab {
                padding: 10px 20px;
                margin: 2px;
            }
            QTabBar::tab:selected {
                background-color: #4CAF50;
                color: white;
            }
        """)
        
        # Tab 1: Local Tracking
        self.tracking_tab = QWidget()
        self.init_tracking_tab()
        
        # Tab 2 & 3: Cloud Optimization (only if enabled)
        if ENABLE_CLOUD_FEATURES:
            self.cloud_tab = QWidget()
            self.init_cloud_tab()
            self.tabs.addTab(self.tracking_tab, "📊 Local Tracking")
            self.tabs.addTab(self.cloud_tab, "☁️ Cloud Optimization")
            
            # Tab 3: Active Instances
            self.instances_tab = QWidget()
            self.init_instances_tab()
            self.tabs.addTab(self.instances_tab, "🖥️ Active Instances")
        else:
            self.tabs.addTab(self.tracking_tab, "📊 Local Tracking")
        
        main_layout.addWidget(self.tabs)
        self.setLayout(main_layout)

    def init_tracking_tab(self):
        layout = QVBoxLayout()
        
        # Info label
        self.label = QLabel("Press Start to begin tracking your device emissions.")
        self.label.setWordWrap(True)
        self.label.setStyleSheet("margin: 10px; font-size: 14px; padding: 20px; background-color: #f0f0f0; border-radius: 5px;")
        self.label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        # Buttons
        button_layout = QVBoxLayout()
        
        self.start_btn = QPushButton("▶️ Start Tracking")
        self.start_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                padding: 15px;
                font-size: 16px;
                font-weight: bold;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QPushButton:disabled {
                background-color: #ccc;
            }
        """)
        
        self.stop_btn = QPushButton("⏹️ Stop and Save Data")
        self.stop_btn.setEnabled(False)
        self.stop_btn.setStyleSheet("""
            QPushButton {
                background-color: #f44336;
                color: white;
                padding: 15px;
                font-size: 16px;
                font-weight: bold;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #da190b;
            }
            QPushButton:disabled {
                background-color: #ccc;
            }
        """)
        
        self.view_dashboard_btn = QPushButton("🌐 View Web Dashboard")
        self.view_dashboard_btn.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                padding: 15px;
                font-size: 16px;
                font-weight: bold;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #0b7dda;
            }
        """)
        
        button_layout.addWidget(self.start_btn)
        button_layout.addWidget(self.stop_btn)
        button_layout.addWidget(self.view_dashboard_btn)
        
        layout.addWidget(self.label)
        layout.addLayout(button_layout)
        layout.addStretch()
        
        self.tracking_tab.setLayout(layout)
        
        # Connect signals
        self.start_btn.clicked.connect(self.start_tracking)
        self.stop_btn.clicked.connect(self.stop_tracking)
        self.view_dashboard_btn.clicked.connect(lambda: webbrowser.open(DASHBOARD_URL))

    def init_cloud_tab(self):
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll_widget = QWidget()
        layout = QVBoxLayout(scroll_widget)
        
        # Title
        title = QLabel("☁️ Cloud Carbon Optimization")
        title_font = QFont()
        title_font.setPointSize(16)
        title_font.setBold(True)
        title.setFont(title_font)
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)
        
        # Description
        desc = QLabel(
            "Offload your computational tasks to AWS regions with lower carbon intensity.\n"
            "This helps reduce your overall carbon footprint by utilizing renewable energy sources."
        )
        desc.setWordWrap(True)
        desc.setStyleSheet("color: #666; padding: 10px; background-color: #f9f9f9; border-radius: 5px; margin: 10px;")
        layout.addWidget(desc)
        
        # Cloud provider status
        status_group = QGroupBox("AWS Provider Status")
        status_layout = QGridLayout()
        
        aws_status = "✓ Configured" if self.cloud_config['aws'] else "✗ Not Configured"
        
        status_layout.addWidget(QLabel("AWS:"), 0, 0)
        aws_label = QLabel(aws_status)
        aws_label.setStyleSheet(f"color: {'green' if self.cloud_config['aws'] else 'red'}; font-weight: bold;")
        status_layout.addWidget(aws_label, 0, 1)
        
        # Test connection button
        self.test_aws_btn = QPushButton("Test AWS Connection")
        self.test_aws_btn.clicked.connect(lambda: self.test_cloud_connection('aws'))
        self.test_aws_btn.setEnabled(self.cloud_config['aws'])
        status_layout.addWidget(self.test_aws_btn, 0, 2)
        
        status_group.setLayout(status_layout)
        layout.addWidget(status_group)
        
        # Region selection group
        region_group = QGroupBox("Select AWS Region")
        region_layout = QVBoxLayout()
        
        provider_layout = QHBoxLayout()
        provider_layout.addWidget(QLabel("Filter:"))
        self.provider_combo = QComboBox()
        self.provider_combo.addItems(["AWS Only", "Show All (Reference)"])
        self.provider_combo.currentTextChanged.connect(self.load_regions)
        provider_layout.addWidget(self.provider_combo)
        
        self.refresh_regions_btn = QPushButton("🔄 Refresh")
        self.refresh_regions_btn.clicked.connect(self.load_regions)
        provider_layout.addWidget(self.refresh_regions_btn)
        region_layout.addLayout(provider_layout)
        
        region_layout.addWidget(QLabel("Available Regions (sorted by carbon intensity):"))
        self.region_combo = QComboBox()
        self.region_combo.setMinimumHeight(40)
        region_layout.addWidget(self.region_combo)
        
        region_group.setLayout(region_layout)
        layout.addWidget(region_group)
        
        # Workload configuration group
        workload_group = QGroupBox("Workload Configuration")
        workload_layout = QGridLayout()
        
        workload_layout.addWidget(QLabel("Workload Type:"), 0, 0)
        self.workload_type = QComboBox()
        self.workload_type.addItems(["computation", "storage", "processing", "training", "batch"])
        workload_layout.addWidget(self.workload_type, 0, 1)
        
        workload_layout.addWidget(QLabel("Instance Type:"), 1, 0)
        self.instance_type = QComboBox()
        self.instance_type.addItems(["t2.micro", "t2.small", "t3.micro", "t3.small"])
        workload_layout.addWidget(self.instance_type, 1, 1)
        
        workload_layout.addWidget(QLabel("Duration (hours):"), 2, 0)
        self.duration_spin = QDoubleSpinBox()
        self.duration_spin.setRange(0.1, 24.0)
        self.duration_spin.setValue(1.0)
        self.duration_spin.setSingleStep(0.5)
        workload_layout.addWidget(self.duration_spin, 2, 1)
        
        workload_layout.addWidget(QLabel("Est. Power (watts):"), 3, 0)
        self.power_spin = QSpinBox()
        self.power_spin.setRange(1, 500)
        self.power_spin.setValue(100)
        workload_layout.addWidget(self.power_spin, 3, 1)
        
        workload_group.setLayout(workload_layout)
        layout.addWidget(workload_group)
        
        # Calculate button
        self.calculate_btn = QPushButton("💡 Calculate Savings")
        self.calculate_btn.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                padding: 12px;
                font-size: 14px;
                font-weight: bold;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #0b7dda;
            }
        """)
        self.calculate_btn.clicked.connect(self.calculate_savings)
        layout.addWidget(self.calculate_btn)
        
        # Results display
        self.results_text = QTextEdit()
        self.results_text.setReadOnly(True)
        self.results_text.setMaximumHeight(200)
        self.results_text.setStyleSheet("background-color: #f9f9f9; padding: 10px; border-radius: 5px;")
        layout.addWidget(self.results_text)
        
        # Action buttons
        button_layout = QHBoxLayout()
        
        self.launch_instance_btn = QPushButton("🚀 Launch Real AWS Instance")
        self.launch_instance_btn.setEnabled(False)
        self.launch_instance_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                padding: 12px;
                font-size: 14px;
                font-weight: bold;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QPushButton:disabled {
                background-color: #ccc;
            }
        """)
        self.launch_instance_btn.clicked.connect(self.launch_cloud_instance)
        
        self.submit_workload_btn = QPushButton("📝 Submit Workload (Simulated)")
        self.submit_workload_btn.setEnabled(False)
        self.submit_workload_btn.setStyleSheet("""
            QPushButton {
                background-color: #ff9800;
                color: white;
                padding: 12px;
                font-size: 14px;
                font-weight: bold;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #e68900;
            }
            QPushButton:disabled {
                background-color: #ccc;
            }
        """)
        self.submit_workload_btn.clicked.connect(self.submit_workload)
        
        button_layout.addWidget(self.launch_instance_btn)
        button_layout.addWidget(self.submit_workload_btn)
        layout.addLayout(button_layout)
        
        # View workloads button
        self.view_workloads_btn = QPushButton("📋 View My Cloud Workloads")
        self.view_workloads_btn.setStyleSheet("""
            QPushButton {
                background-color: #9C27B0;
                color: white;
                padding: 12px;
                font-size: 14px;
                font-weight: bold;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #7B1FA2;
            }
        """)
        self.view_workloads_btn.clicked.connect(self.view_workloads)
        layout.addWidget(self.view_workloads_btn)
        
        layout.addStretch()
        scroll.setWidget(scroll_widget)
        
        tab_layout = QVBoxLayout()
        tab_layout.addWidget(scroll)
        self.cloud_tab.setLayout(tab_layout)
        
        # Load regions on init
        self.load_regions()

    def init_instances_tab(self):
        layout = QVBoxLayout()
        
        # Title
        title = QLabel("🖥️ Active AWS Instances")
        title_font = QFont()
        title_font.setPointSize(14)
        title_font.setBold(True)
        title.setFont(title_font)
        layout.addWidget(title)
        
        # Info
        info = QLabel("Managed instances will appear here. Auto-refreshes every 30 seconds.")
        info.setStyleSheet("color: #666; margin-bottom: 10px;")
        layout.addWidget(info)
        
        # Refresh button
        refresh_btn = QPushButton("🔄 Refresh Now")
        refresh_btn.clicked.connect(self.refresh_instances)
        layout.addWidget(refresh_btn)
        
        # Instances table
        self.instances_table = QTableWidget()
        self.instances_table.setColumnCount(6)
        self.instances_table.setHorizontalHeaderLabels([
            "Provider", "Instance ID", "Type", "Status", "Region", "Actions"
        ])
        self.instances_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.instances_table.setAlternatingRowColors(True)
        layout.addWidget(self.instances_table)
        
        self.instances_tab.setLayout(layout)
        
        # Initial load
        self.refresh_instances()

    # Cloud Tab Methods
    def test_cloud_connection(self, provider):
        result = self.cloud_service.test_connection(provider)
        
        if result and result.get('success'):
            QMessageBox.information(
                self, 
                f"{provider.upper()} Connection", 
                f"✓ Successfully connected to {provider.upper()}!\n\n"
                f"Region: {result.get('region', 'N/A')}\n"
                f"{result.get('message', '')}"
            )
        else:
            error_msg = result.get('error', 'Unknown error') if result else 'Connection failed'
            QMessageBox.warning(
                self, 
                f"{provider.upper()} Connection", 
                f"✗ Failed to connect to {provider.upper()}\n\n"
                f"Error: {error_msg}\n\n"
                f"Please check your .env file and AWS credentials."
            )

    def load_regions(self):
        filter_text = self.provider_combo.currentText()
        provider_param = 'aws' if filter_text == "AWS Only" else None
        
        self.refresh_regions_btn.setEnabled(False)
        self.refresh_regions_btn.setText("Loading...")
        
        data = self.cloud_service.get_available_regions(provider_param)
        
        self.refresh_regions_btn.setEnabled(True)
        self.refresh_regions_btn.setText("🔄 Refresh")
        
        if data and 'regions' in data:
            self.region_combo.clear()
            self.regions_data = {}
            
            # Filter to only show AWS regions (available ones)
            aws_regions = [r for r in data['regions'] if r['provider'] == 'aws']
            
            for region in aws_regions:
                display_text = (
                    f"{region['regionName']} "
                    f"({region['carbonIntensity']} gCO₂/kWh, "
                    f"{region['renewablePercentage']}% renewable)"
                )
                self.region_combo.addItem(display_text)
                self.regions_data[display_text] = region
            
            if aws_regions:
                rec = aws_regions[0]  # Greenest AWS region
                self.results_text.setPlainText(
                    f"💚 Greenest AWS Region (Recommended):\n\n"
                    f"Provider: AWS\n"
                    f"Region: {rec['regionName']} ({rec['region']})\n"
                    f"Carbon Intensity: {rec['carbonIntensity']} gCO₂/kWh\n"
                    f"Renewable Energy: {rec['renewablePercentage']}%\n"
                    f"Country: {rec['country']}\n\n"
                    f"Total AWS Regions Available: {len(aws_regions)}"
                )
        else:
            QMessageBox.warning(self, "Error", "Failed to load cloud regions.\n\nMake sure the backend is running and regions are seeded.")

    def calculate_savings(self):
        if not self.region_combo.currentText():
            QMessageBox.warning(self, "No Region", "Please select an AWS region first")
            return
        
        selected_region_text = self.region_combo.currentText()
        if selected_region_text not in self.regions_data:
            QMessageBox.warning(self, "Error", "Invalid region selection")
            return
        
        region = self.regions_data[selected_region_text]
        
        duration = self.duration_spin.value()
        power = self.power_spin.value()
        workload_type = self.workload_type.currentText()
        
        self.calculate_btn.setEnabled(False)
        self.calculate_btn.setText("Calculating...")
        
        try:
            data = self.cloud_service.calculate_savings(
                workload_type, duration, power, region['_id']
            )
            
            self.calculate_btn.setEnabled(True)
            self.calculate_btn.setText("💡 Calculate Savings")
            
            if data:
                # Print debug info
                print("API Response:", data)
                
                self.savings_data = data
                self.savings_data['selected_region'] = region
                
                # Safely extract values with fallbacks
                savings_gco2 = str(data.get('savingsGCO2', data.get('savings', '0')))
                savings_percent = str(data.get('savingsPercentage', '0'))
                local_emissions = str(data.get('localEmissions', '0'))
                cloud_emissions = str(data.get('cloudEmissions', '0'))
                energy_kwh = str(data.get('energyKWh', '0'))
                
                # Get region info safely
                region_info = data.get('region', {})
                region_name = region_info.get('name', region.get('regionName', 'Unknown'))
                carbon_intensity = region_info.get('carbonIntensity', region.get('carbonIntensity', 'N/A'))
                renewable_pct = region_info.get('renewablePercentage', region.get('renewablePercentage', 'N/A'))
                
                result_text = (
                    f"📊 Carbon Savings Calculation:\n"
                    f"{'='*50}\n\n"
                    f"Local Emissions:  {local_emissions} gCO₂\n"
                    f"Cloud Emissions:  {cloud_emissions} gCO₂\n"
                    f"Energy Usage:     {energy_kwh} kWh\n\n"
                    f"💚 SAVINGS:       {savings_gco2} gCO₂ ({savings_percent}%)\n\n"
                    f"{'='*50}\n"
                    f"Selected AWS Region:\n"
                    f"  • Provider: AWS\n"
                    f"  • Location: {region_name}\n"
                    f"  • Carbon Intensity: {carbon_intensity} gCO₂/kWh\n"
                    f"  • Renewable Energy: {renewable_pct}%\n"
                )
                
                self.results_text.setPlainText(result_text)
                self.launch_instance_btn.setEnabled(True)
                self.submit_workload_btn.setEnabled(True)
            else:
                QMessageBox.warning(self, "Error", "Failed to calculate savings.\n\nMake sure the backend is running.")
                
        except Exception as e:
            self.calculate_btn.setEnabled(True)
            self.calculate_btn.setText("💡 Calculate Savings")
            print(f"Error in calculate_savings: {e}")
            import traceback
            traceback.print_exc()
            QMessageBox.warning(
                self, 
                "Calculation Error", 
                f"An error occurred:\n\n{str(e)}\n\nCheck the console for details."
            )

    def launch_cloud_instance(self):
        if not self.savings_data:
            QMessageBox.warning(self, "Error", "Please calculate savings first")
            return
        
        region_data = self.savings_data['selected_region']
        provider = 'aws'
        aws_region = region_data['region']
        instance_type = self.instance_type.currentText()
        
        # Safely extract savings with fallbacks
        savings_gco2 = self.savings_data.get('savingsGCO2', self.savings_data.get('savingsGCO₂', '0'))
        region_name = region_data.get('regionName', 'Unknown')
        
        # Confirm launch
        reply = QMessageBox.question(
            self,
            "Launch Real AWS Instance",
            f"⚠️ WARNING: This will create a REAL AWS EC2 instance!\n\n"
            f"Instance Type: {instance_type}\n"
            f"Region: {region_name} ({aws_region})\n"
            f"Est. Duration: {self.duration_spin.value()} hours\n"
            f"Est. Cost: ~${0.0116 * self.duration_spin.value():.4f}\n"
            f"Est. Savings: {savings_gco2} gCO₂\n\n"
            f"Make sure to TERMINATE the instance when done!\n\n"
            f"Continue?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.No:
            return
        
        self.launch_instance_btn.setEnabled(False)
        self.launch_instance_btn.setText("Launching...")
        
        result = self.cloud_service.launch_instance(
            provider=provider,
            region=aws_region,
            zone=None,  # AWS doesn't need zone
            instance_type=instance_type,
            workload_type=self.workload_type.currentText(),
            duration_hours=self.duration_spin.value()
        )
        
        self.launch_instance_btn.setEnabled(True)
        self.launch_instance_btn.setText("🚀 Launch Real AWS Instance")
        
        if result and result.get('message') == 'Instance launched successfully':
            instance = result.get('instance', {})
            workload = result.get('workload', {})
            
            QMessageBox.information(
                self,
                "✓ Instance Launched",
                f"AWS Instance launched successfully!\n\n"
                f"Instance ID: {instance.get('instanceId')}\n"
                f"Status: {instance.get('state')}\n"
                f"Region: {aws_region}\n"
                f"Workload ID: {workload.get('id')}\n"
                f"Est. Savings: {workload.get('savingsGCO2', 0):.2f} gCO₂\n\n"
                f"⚠️ IMPORTANT:\n"
                f"Switch to 'Active Instances' tab to monitor and terminate when done!\n"
                f"Remember: You pay for every hour it runs!"
            )
            
            # Switch to instances tab
            if hasattr(self, 'instances_tab'):
                self.tabs.setCurrentWidget(self.instances_tab)
                self.refresh_instances()
        else:
            error_msg = result.get('error', 'Unknown error') if result else 'Launch failed'
            QMessageBox.warning(
                self,
                "Launch Failed",
                f"Failed to launch AWS instance\n\n"
                f"Error: {error_msg}\n\n"
                f"Please check:\n"
                f"1. Backend is running\n"
                f"2. AWS credentials are correct\n"
                f"3. You have permissions in AWS"
            )

    def submit_workload(self):
        if not self.savings_data:
            QMessageBox.warning(self, "Error", "Please calculate savings first")
            return
        
        region = self.savings_data['selected_region']
        
        # Safely extract values with fallbacks
        local_emissions = float(self.savings_data.get('localEmissions', '0'))
        cloud_emissions = float(self.savings_data.get('cloudEmissions', '0'))
        energy_kwh = float(self.savings_data.get('energyKWh', '0'))
        
        workload_data = {
            "workloadType": self.workload_type.currentText(),
            "targetCloudRegion": region['region'],
            "cloudProvider": 'aws',
            "estimatedLocalEmissions": local_emissions,
            "estimatedCloudEmissions": cloud_emissions,
            "metadata": {
                "duration": self.duration_spin.value(),
                "power": self.power_spin.value(),
                "energyKWh": energy_kwh,
                "simulated": True
            }
        }
        
        self.submit_workload_btn.setEnabled(False)
        self.submit_workload_btn.setText("Submitting...")
        
        result = self.cloud_service.submit_workload(workload_data)
        
        self.submit_workload_btn.setEnabled(True)
        self.submit_workload_btn.setText("📝 Submit Workload (Simulated)")
        
        if result:
            # Safely extract savings with fallbacks
            savings_gco2 = self.savings_data.get('savingsGCO2', self.savings_data.get('savingsGCO₂', '0'))
            region_name = region.get('regionName', 'Unknown')
            
            QMessageBox.information(
                self,
                "Success",
                f"✓ Simulated workload submitted successfully!\n\n"
                f"Workload Type: {workload_data['workloadType']}\n"
                f"Est. Savings: {savings_gco2} gCO₂\n"
                f"Region: {region_name}\n\n"
                f"This is a simulated workload for tracking purposes.\n"
                f"No real cloud instance was created."
            )
            self.savings_data = None
            self.submit_workload_btn.setEnabled(False)
            self.launch_instance_btn.setEnabled(False)
        else:
            QMessageBox.warning(self, "Error", "Failed to submit workload")

    def view_workloads(self):
        data = self.cloud_service.get_workloads(limit=20)
        
        if data and 'workloads' in data:
            stats = data['stats']
            workloads = data['workloads']
            
            workloads_text = (
                f"📊 YOUR CLOUD WORKLOADS\n"
                f"{'='*60}\n\n"
                f"Total Workloads: {stats['totalWorkloads']}\n"
                f"Total Savings: {stats['totalSavings']} gCO₂\n"
                f"Total Cost: ${stats['totalCost']}\n\n"
                f"By Status:\n"
                f"  • Pending: {stats['byStatus']['pending']}\n"
                f"  • Running: {stats['byStatus']['running']}\n"
                f"  • Completed: {stats['byStatus']['completed']}\n"
                f"  • Failed: {stats['byStatus']['failed']}\n\n"
                f"AWS Workloads: {stats['byProvider']['aws']}\n\n"
                f"{'='*60}\n\n"
                f"Recent Workloads:\n\n"
            )
            
            for i, w in enumerate(workloads[:10], 1):
                workloads_text += (
                    f"{i}. {w['workloadType'].title()} - {w['cloudProvider'].upper()}\n"
                    f"   Region: {w['targetCloudRegion']}\n"
                    f"   Status: {w['status']}\n"
                    f"   Savings: {w['savingsGCO2']:.2f} gCO₂\n"
                    f"   Started: {w['startTime'][:19]}\n\n"
                )
            
            if not workloads:
                workloads_text += "No workloads yet. Submit one to get started!\n"
            
            self.results_text.setPlainText(workloads_text)
        else:
            QMessageBox.warning(self, "Error", "Failed to load workloads")

    def refresh_instances(self):
        if not ENABLE_CLOUD_FEATURES or not self.cloud_config['aws']:
            return
        
        self.instances_table.setRowCount(0)
        all_instances = []
        
        # Fetch AWS instances from all common regions
        aws_regions = ['us-east-1', 'us-west-2', 'eu-north-1', 'eu-west-1']
        
        for aws_region in aws_regions:
            aws_result = self.cloud_service.list_instances('aws', region=aws_region)
            if aws_result and aws_result.get('success'):
                for inst in aws_result.get('instances', []):
                    all_instances.append({
                        'provider': 'AWS',
                        'instanceId': inst['instanceId'],
                        'instanceType': inst.get('instanceType', 'N/A'),
                        'status': inst.get('state', 'unknown'),
                        'region': aws_region,
                        'zone': None
                    })
        
        # Populate table
        self.instances_table.setRowCount(len(all_instances))
        
        for row, inst in enumerate(all_instances):
            self.instances_table.setItem(row, 0, QTableWidgetItem(inst['provider']))
            self.instances_table.setItem(row, 1, QTableWidgetItem(inst['instanceId']))
            self.instances_table.setItem(row, 2, QTableWidgetItem(inst['instanceType']))
            
            status_item = QTableWidgetItem(inst['status'])
            if inst['status'].lower() == 'running':
                status_item.setForeground(Qt.GlobalColor.darkGreen)
            elif inst['status'].lower() in ['stopped', 'terminated']:
                status_item.setForeground(Qt.GlobalColor.red)
            self.instances_table.setItem(row, 3, status_item)
            
            self.instances_table.setItem(row, 4, QTableWidgetItem(inst['region']))
            
            # Add terminate button
            terminate_btn = QPushButton("🗑️ Terminate")
            terminate_btn.setStyleSheet("background-color: #f44336; color: white; padding: 5px;")
            terminate_btn.clicked.connect(
                lambda checked, i=inst: self.terminate_instance(i)
            )
            self.instances_table.setCellWidget(row, 5, terminate_btn)
        
        self.active_instances = all_instances

    def terminate_instance(self, instance_info):
        reply = QMessageBox.question(
            self,
            "Terminate Instance",
            f"⚠️ Are you sure you want to TERMINATE this instance?\n\n"
            f"Provider: {instance_info['provider']}\n"
            f"Instance: {instance_info['instanceId']}\n"
            f"Status: {instance_info['status']}\n"
            f"Region: {instance_info['region']}\n\n"
            f"This action cannot be undone!",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.No:
            return
        
        provider = instance_info['provider'].lower()
        instance_id = instance_info['instanceId']
        region = instance_info.get('region')
        
        result = self.cloud_service.terminate_instance(
            provider=provider,
            instance_id=instance_id,
            region=region
        )
        
        if result and result.get('message') == 'Instance terminated successfully':
            QMessageBox.information(
                self,
                "Success",
                f"✓ Instance terminated successfully!\n\n"
                f"Instance: {instance_id}\n"
                f"Region: {region}"
            )
            self.refresh_instances()
        else:
            error_msg = result.get('error', 'Unknown error') if result else 'Termination failed'
            QMessageBox.warning(
                self,
                "Termination Failed",
                f"Failed to terminate instance\n\n"
                f"Error: {error_msg}"
            )

    # Tracking Tab Methods
    def start_tracking(self):
        self.tracker = TrackerSession(
            user_id=self.user_id,
            device_id="desktop-app",
            token=self.token
        )
        self.tracker.start()
        self.label.setText(
            "🔄 Tracking energy consumption...\n\n"
            "The app is now monitoring your device's carbon emissions.\n"
            "Press 'Stop' when you want to end the tracking session."
        )
        self.start_btn.setEnabled(False)
        self.stop_btn.setEnabled(True)

    def stop_tracking(self):
        if not self.tracker:
            self.label.setText("Error: Tracker not running.")
            return
            
        data = self.tracker.stop()
        
        if data:
            self.label.setText(
                f"✅ Session complete!\n\n"
                f"Energy: {data['energy_kwh']:.6f} kWh\n"
                f"CO₂: {data['emissions_gco2']:.4f} g\n"
                f"Duration: {data['duration_seconds']:.0f} seconds\n\n"
                f"Data uploaded to your dashboard!\n"
                f"View your complete history on the web dashboard."
            )
        else:
            self.label.setText(
                "❌ Error: Failed to save tracking data.\n\n"
                f"Please check your internet connection and try again."
            )
            
        self.start_btn.setEnabled(True)
        self.stop_btn.setEnabled(False)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setStyle('Fusion')
    
    login_window = LoginWindow()
    login_window.show()
    sys.exit(app.exec())