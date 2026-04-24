import { Colors } from '@/core/theme/colors';
import { Course } from '@/shared/types';

export const generateCourseHtml = (course: Course) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          :root {
            --primary: ${Colors.primary};
            --primary-light: #ecfdf5;
            --text: ${Colors.text};
            --text-muted: ${Colors.textMuted};
            --background: #f8fafc;
            --surface: #ffffff;
            --border: #f1f5f9;
            --success: #10b981;
            --error: #ef4444;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--background);
            color: var(--text);
            margin: 0;
            padding: 0;
            line-height: 1.6;
            -webkit-tap-highlight-color: transparent;
            overflow-x: hidden;
          }
          
          /* Video Header Placeholder */
          .video-container {
            width: 100%;
            height: 240px;
            background: #0f172a;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .video-container::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
          }
          .play-btn {
            width: 64px;
            height: 64px;
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(8px);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            border: 2px solid rgba(255,255,255,0.4);
          }
          .play-btn-triangle {
            width: 0;
            height: 0;
            border-top: 12px solid transparent;
            border-bottom: 12px solid transparent;
            border-left: 20px solid white;
            margin-left: 6px;
          }

          .container {
            padding: 24px;
          }

          .header-info {
            margin-bottom: 32px;
          }
          .badge {
            display: inline-block;
            background: var(--primary-light);
            color: var(--primary);
            font-size: 11px;
            font-weight: 800;
            border-radius: 999px;
            padding: 6px 14px;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          h1 { 
            font-size: 28px; 
            margin: 0 0 12px 0; 
            color: #0f172a; 
            letter-spacing: -0.8px;
            line-height: 1.2;
            font-weight: 800;
          }
          .instructor { 
            display: flex;
            align-items: center;
            color: var(--text-muted); 
            font-size: 15px; 
            font-weight: 600; 
          }
          .instructor-avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #e2e8f0;
            margin-right: 10px;
          }

          .card {
            background: var(--surface);
            padding: 24px;
            border-radius: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.03);
            margin-bottom: 24px;
            border: 1px solid var(--border);
          }
          
          h3 {
            font-size: 18px;
            font-weight: 800;
            margin: 0 0 20px 0;
            color: #0f172a;
          }

          /* Code Snippet */
          .code-block {
            background: #1e293b;
            border-radius: 16px;
            padding: 20px;
            margin: 20px 0;
            overflow-x: auto;
            position: relative;
          }
          .code-block::before {
            content: 'typescript';
            position: absolute;
            top: 0;
            right: 0;
            background: rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.7);
            font-size: 10px;
            padding: 4px 10px;
            border-bottom-left-radius: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .code-block pre { margin: 0; color: #e2e8f0; font-family: monospace; font-size: 13px; line-height: 1.5; }
          .token.keyword { color: #c678dd; }
          .token.function { color: #61afef; }
          .token.string { color: #98c379; }

          /* Lessons */
          .lesson-item {
            display: flex;
            align-items: center;
            padding: 16px;
            background: #f8fafc;
            border-radius: 16px;
            margin-bottom: 12px;
          }
          .lesson-item.active {
            background: var(--primary-light);
            border: 1px solid rgba(34, 197, 94, 0.2);
          }
          .lesson-icon {
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            font-weight: bold;
            color: var(--primary);
          }
          .lesson-title { font-weight: 700; color: #0f172a; font-size: 15px; }
          .lesson-duration { font-size: 12px; color: var(--text-muted); margin-top: 4px; font-weight: 600;}

          /* Quiz Node */
          .quiz-node {
            background: #f8fafc;
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 24px;
            border: 1px solid #e2e8f0;
          }
          .question-text { 
            font-weight: 800; 
            font-size: 17px; 
            margin-bottom: 16px; 
            display: block; 
            color: #0f172a;
          }
          .option-label {
            display: flex;
            align-items: center;
            padding: 16px;
            background: white;
            border: 2px solid transparent;
            border-radius: 16px;
            margin-bottom: 10px;
            font-size: 15px;
            font-weight: 600;
            color: #475569;
            box-shadow: 0 2px 6px rgba(0,0,0,0.02);
            transition: all 0.2s;
          }
          .option-label input { display: none; }
          .radio-custom {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid #cbd5e1;
            margin-right: 14px;
            position: relative;
          }
          .option-label:has(input:checked) {
            border-color: var(--primary);
            background: var(--primary-light);
            color: var(--primary);
          }
          .option-label:has(input:checked) .radio-custom {
            border-color: var(--primary);
          }
          .option-label:has(input:checked) .radio-custom::after {
            content: '';
            position: absolute;
            top: 4px; left: 4px; right: 4px; bottom: 4px;
            background: var(--primary);
            border-radius: 50%;
          }
          
          .btn {
            background: var(--primary);
            color: white;
            border: none;
            padding: 16px;
            border-radius: 16px;
            width: 100%;
            font-size: 16px;
            font-weight: 800;
            margin-top: 10px;
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
          }
          .btn-outline {
            background: transparent;
            color: var(--primary);
            border: 2px solid var(--primary);
            box-shadow: none;
          }
          
          .feedback {
            margin-top: 16px;
            padding: 16px;
            border-radius: 16px;
            font-size: 14px;
            font-weight: 600;
            display: none;
            animation: slideIn 0.3s ease-out;
          }
          @keyframes slideIn {
            from { transform: translateY(-10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .feedback.correct { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
          .feedback.incorrect { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        </style>
      </head>
      <body>
        <div class="video-container">
          <div class="play-btn"><div class="play-btn-triangle"></div></div>
          <div style="position: absolute; bottom: 16px; left: 20px; z-index: 10;">
            <span style="background: rgba(0,0,0,0.6); color: white; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: bold; backdrop-filter: blur(4px);">Preview</span>
          </div>
        </div>

        <div class="container">
          <div class="header-info">
            <div class="badge">${course.category}</div>
            <h1>${course.title}</h1>
            <div class="instructor">
              <div class="instructor-avatar"></div>
              ${course.instructor.name}
            </div>
          </div>

          <div class="card">
            <h3>Overview</h3>
            <p style="color: #475569; font-size: 15px; margin: 0;">${course.description}</p>
            
            <div class="code-block">
<pre><span class="token keyword">import</span> { useState } <span class="token keyword">from</span> <span class="token string">'react'</span>;

<span class="token keyword">export function</span> <span class="token function">CourseComponent</span>() {
  <span class="token keyword">const</span> [isAwesome, setIsAwesome] = <span class="token function">useState</span>(true);
  <span class="token keyword">return</span> &lt;div&gt;Ready to Build&lt;/div&gt;;
}</pre>
            </div>
          </div>

          <div class="card">
            <h3>Curriculum</h3>
            <div class="lesson-list">
              <div class="lesson-item active">
                <div class="lesson-icon">▶</div>
                <div>
                  <div class="lesson-title">1. Introduction to ${course.category}</div>
                  <div class="lesson-duration">12 mins • Video</div>
                </div>
              </div>
              <div class="lesson-item">
                <div class="lesson-icon">2</div>
                <div>
                  <div class="lesson-title">2. Core Concepts</div>
                  <div class="lesson-duration">25 mins • Article</div>
                </div>
              </div>
              <div class="lesson-item">
                <div class="lesson-icon">3</div>
                <div>
                  <div class="lesson-title">3. Final Assessment</div>
                  <div class="lesson-duration">15 mins • Quiz</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <h3>Knowledge Check</h3>
            <div class="quiz-node" id="q1">
              <span class="question-text">1. What is the primary focus of this learning module?</span>
              <label class="option-label" onclick="selectOption(this)">
                <input type="radio" name="q1" value="A">
                <div class="radio-custom"></div>
                Mastering modern architecture
              </label>
              <label class="option-label" onclick="selectOption(this)">
                <input type="radio" name="q1" value="B">
                <div class="radio-custom"></div>
                Writing legacy code patterns
              </label>
              <button class="btn" onclick="checkAnswer('q1', 'A')">Submit Answer</button>
              <div id="q1-feedback" class="feedback"></div>
            </div>
            
            <div id="quiz-complete" style="display: none; text-align: center; padding: 20px 0;">
              <div style="font-size: 48px; margin-bottom: 16px;">🏆</div>
              <h3 style="margin-bottom: 8px;">Module Completed!</h3>
              <p style="color: var(--text-muted); margin-bottom: 24px;">You earned 50 points.</p>
              <button class="btn btn-outline" onclick="completeCourse()">Claim Reward & Finish</button>
            </div>
          </div>
        </div>

        <script>
          const answers = { q1: null };
          let totalScore = 0;

          function selectOption(label) {
            const input = label.querySelector('input');
            const qId = input.name;
            if (answers[qId] !== null) return; // Prevent change after submit
            
            // Uncheck others in group visually handled by CSS :has, but we ensure radio is checked
            input.checked = true;
          }

          function checkAnswer(qId, correct) {
            const selected = document.querySelector('input[name="' + qId + '"]:checked');
            const feedback = document.getElementById(qId + '-feedback');
            
            if (!selected) {
              alert('Please select an option first.');
              return;
            }

            if (answers[qId] !== null) return; 

            if (selected.value === correct) {
              feedback.innerHTML = '<strong>Correct!</strong> Great job.';
              feedback.className = 'feedback correct';
              totalScore += 100;
            } else {
              feedback.innerHTML = '<strong>Incorrect.</strong> The best answer is ' + correct + '.';
              feedback.className = 'feedback incorrect';
            }
            
            feedback.style.display = 'block';
            answers[qId] = selected.value === correct;
            
            // Disable
            document.querySelectorAll('input[name="' + qId + '"]').forEach(i => i.disabled = true);
            
            checkCompletion();
          }

          function checkCompletion() {
            if (Object.values(answers).every(a => a !== null)) {
              document.getElementById('quiz-complete').style.display = 'block';
              
              // Notify native app
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'QUIZ_SCORE',
                  score: totalScore
                }));
              }
            }
          }

          function completeCourse() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'COMPLETE_COURSE'
              }));
            }
          }
        </script>
      </body>
    </html>
  `;
};
