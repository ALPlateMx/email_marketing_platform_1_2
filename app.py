import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='public', static_url_path='')

HISTORY_FILE = os.path.join(os.path.dirname(__file__), 'history.json')

def load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            try:
                return json.load(f)
            except:
                return []
    return []

def save_history(history_data):
    with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(history_data, f, indent=2, ensure_ascii=False)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "tu_correo@gmail.com")
SMTP_PASS = os.getenv("SMTP_PASS", "tu_contraseña_de_aplicacion")

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/templates/<template_id>/preview', methods=['GET'])
def preview_template(template_id):
    name = request.args.get('name', 'Juan Pérez')
    template_path = os.path.join('templates', 'emails', f"{template_id}.html")
    
    if not os.path.exists(template_path):
        return "Plantilla no encontrada", 404
        
    with open(template_path, 'r', encoding='utf-8') as file:
        html_content = file.read()
        
    # Reemplazar etiqueta {nombre} con el nombre proporcionado
    html_content = html_content.replace('{nombre}', name)
    
    return html_content

@app.route('/api/campaigns/send', methods=['POST'])
def send_campaign():
    data = request.json
    template_id = data.get('templateId')
    subject = data.get('subject')
    custom_name = data.get('customName', 'Usuario')
    recipients = data.get('recipients', [])
    is_simulated = data.get('isSimulated', True)
    
    template_path = os.path.join('templates', 'emails', f"{template_id}.html")
    
    if not os.path.exists(template_path):
        return jsonify({"success": False, "error": "Plantilla no encontrada"}), 404
        
    with open(template_path, 'r', encoding='utf-8') as file:
        base_html_content = file.read()

    results = []
    
    # Configurar servidor SMTP si no es simulado
    server = None
    if not is_simulated:
        try:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
        except Exception as e:
            return jsonify({"success": False, "error": f"Error conectando al servidor SMTP: {str(e)}"}), 500

    for email in recipients:
        html_content = base_html_content.replace('{nombre}', custom_name)
        
        status = "Enviado"
        if not is_simulated:
            try:
                msg = MIMEMultipart()
                msg['From'] = SMTP_USER
                msg['To'] = email
                msg['Subject'] = subject
                
                msg.attach(MIMEText(html_content, 'html', 'utf-8'))
                server.send_message(msg)
            except Exception as e:
                status = f"Error: {str(e)}"
        else:
            status = "Simulado (OK)"
            
        results.append({
            "timestamp": datetime.now().isoformat(),
            "name": custom_name,
            "recipient": email,
            "templateId": template_id,
            "subject": subject,
            "status": status,
            "simulated": is_simulated
        })

    if server:
        server.quit()

    # Guardar en el historial
    current_history = load_history()
    # Insertar al principio para ver los mas recientes primero
    current_history = results + current_history
    save_history(current_history)

    return jsonify({
        "success": True,
        "message": f"Campaña procesada ({len(recipients)} destinatarios)",
        "results": results
    })

@app.route('/api/campaigns/history', methods=['GET'])
def get_history():
    return jsonify(load_history())

@app.route('/api/campaigns/history', methods=['DELETE'])
def clear_history():
    save_history([])
    return jsonify({"success": True})

if __name__ == '__main__':
    print("Iniciando Workana MailHub en http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
