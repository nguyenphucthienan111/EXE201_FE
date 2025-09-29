import "../style/Contact.css";
import { useState } from "react";
import Modal from "./Modal";                     // đảm bảo đường dẫn đúng
import phoneIcon from "../../assets/phone.png";
import counselingIcon from "../../assets/counseling.png";
import webIcon from "../../assets/web.png";

export default function Contact() {
  // mở/đóng Modal FAQ
  const [faqOpen, setFaqOpen] = useState(false);

  const faqs = [
    {
      q: "Tôi có cần tài khoản để gửi tin nhắn không?",
      a: "Không bắt buộc. Bạn có thể gửi tin nhắn qua form ở trên. Nếu đăng nhập, bạn sẽ theo dõi lịch sử trao đổi thuận tiện hơn.",
    },
    {
      q: "Chúng tôi phản hồi trong bao lâu?",
      a: "Thông thường trong 24–48 giờ làm việc. Với các vấn đề khẩn, vui lòng gọi số hotline ở phần Resources.",
    },
    {
      q: "Dữ liệu nhật ký có được mã hóa không?",
      a: "Có. Nhật ký và phân tích AI được mã hóa khi truyền và khi lưu trữ, đảm bảo quyền riêng tư.",
    },
  ];

  return (
    <main className="contact">
      {/* HERO */}
      <section className="contact-hero">
        <h1>We are Here to Help</h1>
        <p>Please fill out the form below, and we will get back to you as soon as possible.</p>

        <div className="cta-buttons">
          {/* => mở modal thay vì scroll */}
          <button className="btn faq-btn" onClick={() => setFaqOpen(true)}>FAQs</button>
          <button className="btn learn-btn">Learn More</button>
        </div>
      </section>

      <hr className="contact-rule" />

      {/* FORM */}
      <section className="contact-form">
        <h2>Contact Us</h2>
        <form className="form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input type="text" id="name" placeholder="Enter your name" />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" placeholder="Enter your email" />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <input type="text" id="message" placeholder="Type your message here" />
            </div>
          </div>

          <button type="submit" className="send-btn">Send Message</button>
        </form>
      </section>

      <hr className="contact-rule" />

      {/* (TUỲ CHỌN) Accordion FAQs ngay trên trang — nếu muốn dùng lại thì bỏ comment khối dưới */}
      {/*
      <section className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqs.map((item, i) => (
            <details key={i} className="faq-item">
              <summary className="faq-q">{item.q}</summary>
              <div className="faq-a"><p>{item.a}</p></div>
            </details>
          ))}
        </div>
      </section>
      <hr className="contact-rule" />
      */}

      {/* RESOURCES */}
      <section className="support-section">
        <h2>Resources for Support</h2>
        <div className="support-items">
          <div className="support-card">
            <div className="icon-circle"><img src={phoneIcon} alt="Hotline" /></div>
            <h3>Hotline</h3>
            <p className="link">1-800-273-8255</p>
          </div>

          <div className="support-card">
            <div className="icon-circle"><img src={counselingIcon} alt="Campus Counseling Center" /></div>
            <h3>Campus Counseling Center</h3>
            <p>Visit our center for support</p>
          </div>

          <div className="support-card">
            <div className="icon-circle"><img src={webIcon} alt="Everquill" /></div>
            <h3>Everquill</h3>
            <p className="link">everquill.com</p>
          </div>
        </div>
      </section>

      {/* MODAL FAQs */}
      <Modal open={faqOpen} onClose={() => setFaqOpen(false)} title="Frequently Asked Questions">
        <div className="faq-list">
          {faqs.map((item, i) => (
            <details key={i} className="faq-item">
              <summary className="faq-q">{item.q}</summary>
              <div className="faq-a"><p>{item.a}</p></div>
            </details>
          ))}
        </div>
      </Modal>
    </main>
  );
}
