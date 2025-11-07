# app.py
import sys, webbrowser, threading
from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QPushButton,
    QLineEdit, QLabel, QMessageBox
)
from auth import login
from tracker import TrackerSession
from config import DASHBOARD_URL

class LoginWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Carbon Tracker - Login")
        self.resize(400, 250)
        self.layout = QVBoxLayout()

        self.title = QLabel("🌍 Carbon Tracker Login")
        self.email_input = QLineEdit(); self.email_input.setPlaceholderText("Email")
        self.pass_input = QLineEdit(); self.pass_input.setEchoMode(QLineEdit.EchoMode.Password)
        self.login_btn = QPushButton("Login")
        self.signup_link = QPushButton("Create Account (Website)")

        self.layout.addWidget(self.title)
        self.layout.addWidget(self.email_input)
        self.layout.addWidget(self.pass_input)
        self.layout.addWidget(self.login_btn)
        self.layout.addWidget(self.signup_link)
        self.setLayout(self.layout)

        self.login_btn.clicked.connect(self.do_login)
        self.signup_link.clicked.connect(lambda: webbrowser.open(DASHBOARD_URL))

    def do_login(self):
        email = self.email_input.text().strip()
        password = self.pass_input.text().strip()
        token = login(email, password)
        if token:
            self.hide()
            self.tracker_window = TrackerWindow(token, email)
            self.tracker_window.show()
        else:
            QMessageBox.warning(self, "Login Failed", "Invalid credentials or empty fields")

class TrackerWindow(QWidget):
    def __init__(self, token, user_id):
        super().__init__()
        self.setWindowTitle("Carbon Tracker Dashboard")
        self.resize(400, 200)
        self.layout = QVBoxLayout()
        self.label = QLabel("Press Start to begin tracking your device emissions.")
        self.start_btn = QPushButton("Start Tracking")
        self.stop_btn = QPushButton("Stop and Save Data")
        self.stop_btn.setEnabled(False)
        self.layout.addWidget(self.label)
        self.layout.addWidget(self.start_btn)
        self.layout.addWidget(self.stop_btn)
        self.setLayout(self.layout)
        self.token, self.user_id = token, user_id
        self.tracker = None

        self.start_btn.clicked.connect(self.start_tracking)
        self.stop_btn.clicked.connect(self.stop_tracking)

    def start_tracking(self):
        self.tracker = TrackerSession(self.user_id)
        self.tracker.start()
        self.label.setText("🔄 Tracking energy consumption...")
        self.start_btn.setEnabled(False)
        self.stop_btn.setEnabled(True)

    def stop_tracking(self):
        data = self.tracker.stop()
        if data:
            self.label.setText(f"✅ Session complete!\n"
                               f"Energy: {data['energy_kwh']:.4f} kWh\n"
                               f"CO₂: {data['emissions_gco2']:.4f} g")
        else:
            self.label.setText("Error: Tracker not running.")
        self.start_btn.setEnabled(True)
        self.stop_btn.setEnabled(False)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    login_window = LoginWindow()
    login_window.show()
    sys.exit(app.exec())
