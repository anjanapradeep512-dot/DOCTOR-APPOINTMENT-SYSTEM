from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="admin@123",  
        database="doctor_appointment",
        port=3306
    )

@app.route('/api/test', methods=['GET'])
def test():
    try:
        conn = get_connection()
        conn.close()
        return jsonify({'status': 'success', 'message': 'Connected to database!'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO patients (name, phone, email, password, age, gender, address)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (data['name'], data['phone'], data['email'], data['password'],
              data.get('age'), data.get('gender'), data.get('address')))
        conn.commit()
        return jsonify({'success': True, 'patient_id': cursor.lastrowid})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        cursor.close()
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute(
        "SELECT patient_id, name FROM patients WHERE email = %s AND password = %s",
        (data['email'], data['password'])
    )
    patient = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if patient:
        return jsonify({'success': True, 'patient': patient})
    return jsonify({'success': False, 'error': 'Invalid credentials'})

@app.route('/api/doctors', methods=['GET'])
def get_doctors():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT doctor_id, name, specialization, fee FROM doctors")
    doctors = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(doctors)

@app.route('/api/doctors/add', methods=['POST'])
def add_doctor():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO doctors (name, specialization, phone, email, fee, experience)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (data['name'], data['specialization'], data['phone'],
              data['email'], data['fee'], data['experience']))
        conn.commit()
        return jsonify({'success': True, 'doctor_id': cursor.lastrowid})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        cursor.close()
        conn.close()

@app.route('/api/book', methods=['POST'])
def book_appointment():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, symptoms)
            VALUES (%s, %s, %s, %s, %s)
        """, (data['patient_id'], data['doctor_id'], data['date'], data['time'], data['symptoms']))
        conn.commit()
        return jsonify({'success': True, 'appointment_id': cursor.lastrowid})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        cursor.close()
        conn.close()

@app.route('/api/appointments/<int:patient_id>', methods=['GET'])
def get_appointments(patient_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT a.appointment_id, d.name as doctor_name, d.specialization,
               a.appointment_date, a.appointment_time, a.status, a.symptoms
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.doctor_id
        WHERE a.patient_id = %s
        ORDER BY a.appointment_date DESC
    """, (patient_id,))
    appointments = cursor.fetchall()
    
    # Convert time and date objects to strings for JSON serialization
    for app in appointments:
        if app.get('appointment_time'):
            app['appointment_time'] = str(app['appointment_time'])
        if app.get('appointment_date'):
            app['appointment_date'] = str(app['appointment_date'])
    
    cursor.close()
    conn.close()
    return jsonify(appointments)

@app.route('/api/cancel/<int:appointment_id>', methods=['DELETE'])
def cancel_appointment(appointment_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE appointments SET status = 'Cancelled' WHERE appointment_id = %s", (appointment_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute(
        "SELECT admin_id, username, role FROM admin WHERE username = %s AND password = %s",
        (data['username'], data['password'])
    )
    admin = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if admin:
        return jsonify({'success': True, 'admin': admin})
    return jsonify({'success': False, 'error': 'Invalid credentials'})

@app.route('/api/all-appointments', methods=['GET'])
def all_appointments():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT a.appointment_id, p.name as patient, d.name as doctor,
               a.appointment_date, a.appointment_time, a.status
        FROM appointments a
        JOIN patients p ON a.patient_id = p.patient_id
        JOIN doctors d ON a.doctor_id = d.doctor_id
        ORDER BY a.appointment_date DESC
        LIMIT 50
    """)
    appointments = cursor.fetchall()
    
    # Convert time and date objects to strings
    for app in appointments:
        if app.get('appointment_time'):
            app['appointment_time'] = str(app['appointment_time'])
        if app.get('appointment_date'):
            app['appointment_date'] = str(app['appointment_date'])
    
    cursor.close()
    conn.close()
    return jsonify(appointments)

@app.route('/api/report/today', methods=['GET'])
def today_report():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM appointments
        WHERE appointment_date = CURDATE()
    """)
    data = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return jsonify({
        'total': int(data[0]) if data[0] else 0,
        'completed': int(data[1]) if data[1] else 0,
        'pending': int(data[2]) if data[2] else 0,
        'cancelled': int(data[3]) if data[3] else 0
    })

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 Starting Doctor Appointment API Server...")
    print("="*50)
    print("📡 API will run at: http://localhost:5000")
    print("🔗 Test API at: http://localhost:5000/api/test")
    print("="*50 + "\n")
    app.run(debug=True, port=5000)