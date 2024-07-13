from flask import Flask, render_template, request, jsonify, redirect, url_for
import sqlite3
import speech_recognition as sr
import os

app = Flask(__name__)

def init_db():
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, content TEXT, highlighted BOOLEAN)''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    init_db()
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    c.execute("SELECT * FROM notes")
    notes = c.fetchall()
    conn.close()
    return render_template('index.html', notes=notes)

@app.route('/add', methods=['POST'])
def add_note():
    content = request.form['content']
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    c.execute("INSERT INTO notes (content, highlighted) VALUES (?, ?)", (content, False))
    conn.commit()
    conn.close()
    return redirect(url_for('index'))

@app.route('/highlight/<int:note_id>')
def highlight(note_id):
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    c.execute("UPDATE notes SET highlighted = NOT highlighted WHERE id = ?", (note_id,))
    conn.commit()
    conn.close()
    return redirect(url_for('index'))

@app.route('/transcribe', methods=['POST'])
def transcribe():
    recognizer = sr.Recognizer()
    if 'audio_file' not in request.files:
        return jsonify({'error': 'No audio file part'})
    
    file = request.files['audio_file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})
    
    if file:
        file_path = os.path.join('uploads', file.filename)
        file.save(file_path)
        print(f"Saved file path: {file_path}")
        
        try:
            with sr.AudioFile(file_path) as source:
                audio = recognizer.record(source)
            os.remove(file_path)  # Clean up the audio file after processing
            text = recognizer.recognize_google(audio)
            return jsonify({'transcription': text})
        except sr.UnknownValueError:
            return jsonify({'error': 'Could not understand audio'})
        except sr.RequestError:
            return jsonify({'error': 'Could not request results'})
        except ValueError as e:
            print(f"ValueError: {e}")
            return jsonify({'error': str(e)})

if __name__ == "__main__":
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    app.run(debug=True)