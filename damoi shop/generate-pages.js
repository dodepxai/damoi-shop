const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');

// Find bounds
const headerEndIdx = indexHtml.indexOf('</header>') + '</header>'.length;
const footerStartIdx = indexHtml.indexOf('<!-- New Premium Footer -->');

if (headerEndIdx === -1 || footerStartIdx === -1) {
  console.log('Could not find header or footer bounds in index.html');
  process.exit(1);
}

const headPart = indexHtml.substring(0, headerEndIdx);
const footPart = indexHtml.substring(footerStartIdx);

const cssAppend = `
    <style>
        .policy-page {
            background-color: #f9f9f9;
            padding: 50px 0;
            color: #333;
        }
        .policy-container {
            max-width: 900px;
            margin: 0 auto;
            background: #fff;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .policy-title {
            text-align: center;
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 30px;
            color: #000;
            text-transform: uppercase;
        }
        .policy-content h3 {
            font-size: 18px;
            font-weight: 700;
            margin-top: 25px;
            margin-bottom: 10px;
            color: #222;
        }
        .policy-content p, .policy-content li {
            font-size: 15px;
            line-height: 1.7;
            color: #555;
            margin-bottom: 10px;
        }
        .policy-content ul {
            padding-left: 20px;
            margin-bottom: 15px;
        }
        .policy-content strong {
            color: #000;
        }
    </style>
`;

const termsBody = `
    <div class="policy-page">
        <div class="container policy-container">
            <h1 class="policy-title">Điều Kiện - Điều Khoản Kinh Doanh</h1>
            <div class="policy-content">
                <p><strong>CÔNG TY CỔ PHẦN DAMOI SHOP</strong> cam kết xây dựng một môi trường mua sắm trực tuyến minh bạch, uy tín và chuyên nghiệp nhất. Khi truy cập, mua sắm và trở thành Khách hàng thân thiết (KHTT) của DAMOI, quý khách vui lòng đọc kỹ các điều khoản dưới đây:</p>
                
                <h3>1. Chấp thuận điều khoản</h3>
                <p>Bằng việc tham gia Chương Trình KHTT hoặc sử dụng dịch vụ trên hệ thống website DAMOI, quý khách hiểu và đồng ý với toàn bộ các chính sách được công bố công khai. Khách hàng cam kết bảo mật thông tin tài khoản của mình và không cung cấp cho bên thứ ba.</p>

                <h3>2. Quyền lợi KHTT</h3>
                <ul>
                    <li>Được thăng hạng và nhận ưu đãi độc quyền (Voucher sinh nhật, Giảm giá thẻ VIP).</li>
                    <li>Tham gia các chương trình khuyến mại giành riêng cho Hội viên.</li>
                    <li>Tra cứu lịch sử mua hàng, tích điểm qua hệ thống Website DAMOI.</li>
                </ul>

                <h3>3. Trách nhiệm của DAMOI SHOP</h3>
                <p>DAMOI cam kết đảm bảo quyền lợi tối đa cho người tiêu dùng theo quy định của pháp luật Việt Nam. Chúng tôi có quyền sửa đổi/cập nhật chính sách KHTT vào bất kì thời điểm nào và sẽ thông báo công khai trên website.</p>

                <h3>4. Xử lý gian lận</h3>
                <p>DAMOI có quyền từ chối cung cấp dịch vụ, tước quyền hạng thành viên nếu phát hiện các hành vi gian lận trục lợi ưu đãi, sao chép hoặc tấn công hệ thống website/ứng dụng di động do DAMOI quản lý.</p>

                <h3>5. Giải quyết tranh chấp</h3>
                <p>Các điều khoản này tuân thủ các quy định hiện hành của Pháp luật Việt Nam. Mọi tranh chấp nếu có sẽ được hai bên ưu tiên xử lý bằng đàm phán thương lượng, nhằm bảo vệ tình cảm đôi bên.</p>
            </div>
        </div>
    </div>
`;

const privacyBody = `
    <div class="policy-page">
        <div class="container policy-container">
            <h1 class="policy-title">Chính Sách Bảo Mật Thông Tin</h1>
            <div class="policy-content">
                <p><strong>CÔNG TY CỔ PHẦN DAMOI SHOP</strong> tôn trọng và cam kết bảo vệ dữ liệu cá nhân của Khách hàng. Chính sách bảo mật này lý giải cách chúng tôi thu thập, sử dụng và chia sẻ thông tin cá nhân của bạn khi sử dụng dịch vụ tại DAMOI.</p>
                
                <h3>1. Mục đích thu thập thông tin</h3>
                <ul>
                    <li><strong>Xử lý Đơn hàng:</strong> Xác nhận thanh toán, Giao nhận sản phẩm, Hỗ trợ hoàn/trả.</li>
                    <li><strong>Duy trì tài khoản:</strong> Cung cấp ưu đãi KHTT dựa theo lịch sử mua hàng.</li>
                    <li><strong>Dịch vụ hỗ trợ:</strong> Giải đáp thắc mắc, gửi thông báo thay đổi chính sách từ DAMOI.</li>
                </ul>

                <h3>2. Tôn trọng quyền riêng tư tuyệt đối</h3>
                <p>DAMOI cam kết <strong>KHÔNG BÁN, KHÔNG CHO THUÊ</strong> hay trao đổi thông tin cá nhân của Quý khách cho bất cứ tổ chức hay cá nhân bên thứ ba nào vì mục đích thương mại.</p>

                <h3>3. Cam kết an toàn dữ liệu</h3>
                <p>Chúng tôi ứng dụng các tiêu chuẩn an ninh mã hóa dữ liệu cao nhất hiện nay. Mọi giao dịch thông qua cổng thanh toán đều thỏa mãn tiêu chuẩn chứng chỉ bảo mật quốc tế. Chỉ có nhân viên cấp cao và hệ thống vận hành lõi của DAMOI mới được quyền truy xuất các thông tin này khi thực thi nhiệm vụ.</p>

                <h3>4. Quyền làm chủ dữ liệu của bạn</h3>
                <p>Quý khách hoàn toàn có quyền chủ động đăng nhập vào giao diện Tài Khoản cá nhân nhằm Chỉnh Sửa, Cập Nhật, hoặc Xóa đi các thông tin nhạy cảm. Bạn cũng có thể yêu cầu Bộ phận CSKH xử lý việc khóa tải khoản vĩnh viễn lúc cần thiết.</p>

                <h3>5. Thông tin liên hệ DAMOI</h3>
                <ul>
                    <li>Hỗ trợ mua Online: <strong>1900.xxxx</strong></li>
                    <li>Email CSKH: <strong>hotro@damoishop.com</strong></li>
                    <li>Trụ sở chính: Số 688 Đường Quang Trung, P. Hà Đông, TP. Hà Nội.</li>
                </ul>
            </div>
        </div>
    </div>
`;

const headPartWithCss = headPart.replace('</head>', cssAppend + '</head>');

fs.writeFileSync('dieu-khoan-dich-vu.html', headPartWithCss + termsBody + footPart);
fs.writeFileSync('chinh-sach-bao-mat.html', headPartWithCss + privacyBody + footPart);

console.log('Successfully created dieu-khoan-dich-vu.html & chinh-sach-bao-mat.html');
