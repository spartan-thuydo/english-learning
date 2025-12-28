#!/usr/bin/env python3
"""
Script to fill in answers and translations for fill-in-the-blank questions
New format: vocabulary separate, fillInTheBlanks.tasks grouped
"""

import json

def fill_unit1_answers():
    """Fill answers for Unit 1 - Dolphin Conservation Trust"""

    with open('public/lessons/json/unit1-listening.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Task 1 answers - matching exact sentences
    task1_answers = [
        ("employ", "Chúng tôi hy vọng có đủ tiền để thuê một chuyên gia."),
        ("pleased", "Chúng tôi rất vui vì bạn có thể đến đám cưới."),
        ("suffered", "Tôi nghĩ anh ấy đã chịu đựng rất nhiều khi vợ anh ấy bỏ đi."),
        ("campaign", "Chiến dịch của chúng tôi đã được cư dân địa phương ủng hộ."),
        ("charity", "UNICEF là một tổ chức từ thiện quốc tế."),
        ("purpose", "Mục đích của nghiên cứu là bảo vệ cá heo và các sinh vật biển khác."),
        ("threats", "Do ô nhiễm và các mối đe dọa khác, nhiều sinh vật bị đẩy đến bờ vực tuyệt chủng.")
    ]

    # Task 2 answers
    task2_answers = [
        ("came across", "Anh ấy tình cờ tìm thấy vài bức thư tình cũ."),
        ("hooked", "Chúng tôi sợ cô ấy đang nghiện TV nên chúng tôi đã bán nó."),
        ("monitor populations", "Một nhà sinh vật học được thuê để giám sát quần thể."),
        ("campaigning against", "Anh ấy đã thắng cử vào tháng 11 bằng cách vận động chống lại việc tăng thuế."),
        ("raising people's awareness", "Tờ rơi được sản xuất với mục đích nâng cao nhận thức của mọi người về căn bệnh này."),
        ("marine creatures", "Cá voi xanh là sinh vật biển lớn nhất từng sống."),
        ("in the first place", "Lẽ ra chúng ta không nên đồng ý cho anh ta vay tiền ngay từ đầu."),
        ("pollution", "Công ty khẳng định không chịu trách nhiệm về ô nhiễm trong sông.")
    ]

    # Task 3 answers
    task3_answers = [
        ("exploration", "Việc khám phá các nguồn năng lượng mới rất quan trọng cho tương lai hành tinh của chúng ta."),
        ("trust", "Anh ấy làm việc cho một tổ chức từ thiện."),
        ("expertise", "Cô ấy có kiến thức chuyên môn đáng kể về lịch sử Pháp."),
        ("haven", "Khu vườn là nơi trú ẩn tránh tiếng ồn và sự hối hả của thành phố.")
    ]

    # Task 4 answers
    task4_answers = [
        ("observation", "Việc quan sát cẩn thận thí nghiệm đã giúp họ tìm ra giải pháp."),
        ("animal protection", "Các tình nguyện viên đã tổ chức một nhóm bảo vệ động vật để giúp những con chó hoang."),
        ("award", "Cô ấy nhận được giải thưởng cho công trình đột phá về năng lượng tái tạo."),
        ("biologist", "Nhà sinh vật học đã dành mùa hè nghiên cứu rùa biển."),
        ("shipping", "Công ty cung cấp miễn phí vận chuyển cho đơn hàng trên $50.")
    ]

    # Apply answers to fillInTheBlanks.tasks
    tasks_data = [task1_answers, task2_answers, task3_answers, task4_answers]

    for task_idx, answers in enumerate(tasks_data):
        if task_idx < len(data['fillInTheBlanks']['tasks']):
            for q_idx, (answer, translation) in enumerate(answers):
                if q_idx < len(data['fillInTheBlanks']['tasks'][task_idx]['questions']):
                    data['fillInTheBlanks']['tasks'][task_idx]['questions'][q_idx]['answer'] = answer
                    data['fillInTheBlanks']['tasks'][task_idx]['questions'][q_idx]['translation'] = translation

    # Save back
    with open('public/lessons/json/unit1-listening.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("✓ Unit 1 completed")

def fill_unit2_answers():
    """Fill answers for Unit 2 - PS Camping"""

    with open('public/lessons/json/unit2-listening.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Task 1 answers
    task1_answers = [
        ("exclusive", "CEO có quyền sử dụng độc quyền căn phòng này."),
        ("audience", "Khán giả rất phấn khích với buổi biểu diễn."),
        ("camping equipment", "Công ty chuyên bán thiết bị cắm trại."),
        ("a retail chain", "Công ty bắt đầu mở chuỗi bán lẻ vào năm 2000."),
        ("expanded", "Họ mở rộng hoạt động bán lẻ trong những năm 1980."),
        ("upgrade", "Sau khi mua khách sạn đó, anh ấy quyết định nâng cấp từ mức xếp hạng ba sao ban đầu."),
        ("retail chain", "Vinmart+ là một trong những chuỗi bán lẻ lớn nhất ở Việt Nam."),
        ("campsite", "Địa điểm cắm trại nằm ở vị trí đẹp bên cạnh bãi biển.")
    ]

    # Task 2 answers
    task2_answers = [
        ("rating", "Khách sạn có xếp hạng năm sao."),
        ("superb", "Khách sạn cung cấp các tiện nghi tuyệt vời."),
        ("fully occupied", "Tôi hoàn toàn bận rộn với công việc tuần này."),
        ("take advantage of", "Bạn nên tận dụng ưu đãi này."),
        ("enthusiastic", "Các nhân viên rất nhiệt tình và có trình độ tốt."),
        ("kick off", "Lễ hội sẽ bắt đầu vào tuần tới."),
        ("child-friendly", "Đây là khu nghỉ dưỡng thân thiện với trẻ em."),
        ("in advance", "Vui lòng đặt chỗ trước.")
    ]

    # Task 3 answers
    task3_answers = [
        ("facilities", "Khu cắm trại có các tiện nghi tuyệt vời."),
        ("oven", "Chúng tôi cần một cái lò nướng mới."),
        ("mop", "Tôi cần cây lau nhà để lau sàn."),
        ("bucket", "Hãy đổ đầy nước vào cái xô."),
        ("fridge", "Hãy bảo quản thức ăn trong tủ lạnh.")
    ]

    # Apply answers
    tasks_data = [task1_answers, task2_answers, task3_answers]

    for task_idx, answers in enumerate(tasks_data):
        if task_idx < len(data['fillInTheBlanks']['tasks']):
            for q_idx, (answer, translation) in enumerate(answers):
                if q_idx < len(data['fillInTheBlanks']['tasks'][task_idx]['questions']):
                    data['fillInTheBlanks']['tasks'][task_idx]['questions'][q_idx]['answer'] = answer
                    data['fillInTheBlanks']['tasks'][task_idx]['questions'][q_idx]['translation'] = translation

    # Save back
    with open('public/lessons/json/unit2-listening.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("✓ Unit 2 completed")

def fill_unit3_answers():
    """Fill answers for Unit 3 - Volunteering Work"""

    with open('public/lessons/json/unit3-listening.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Task 1 answers
    task1_answers = [
        ("getting back to work", "Ngủ trưa là cách tốt nhất để nạp lại năng lượng trước khi quay lại làm việc."),
        ("get their hands dirty", "Cuộc đời này thật công bằng. Những người ở trên luôn sẵn sàng làm việc chân tay và không ngừng cải thiện bản thân."),
        ("give up", "Một số người sẵn sàng hy sinh thời gian rảnh trong vài ngày để làm tình nguyện."),
        ("job applicants", "Nhiều ứng viên đơn giản không đáp ứng yêu cầu tuyển dụng."),
        ("commitments", "Nhiều người đang vật lộn để làm những gì họ muốn vì các cam kết với gia đình."),
        ("involves", "Công việc này đòi hỏi một cam kết thời gian lớn."),
        ("get involved", "Cặp đôi đang cãi nhau rất to và tôi sợ tham gia vào.")
    ]

    # Task 2 answers
    task2_answers = [
        ("keep up with", "Công nghệ thay đổi quá nhanh, thật khó để theo kịp nó."),
        ("providing training", "Cung cấp đào tạo giúp phát triển mức độ động lực cao trong đội ngũ bán hàng."),
        ("completed", "Bạn đã hoàn thành mẫu đơn chưa?"),
        ("section", "Bố luôn đọc mục tình nguyện của tờ báo."),
        ("host", "Paris đã được chọn để tổ chức sự kiện tiếp theo."),
        ("conservation project", "Chúng tôi đang làm việc trong dự án bảo tồn."),
        ("fancy", "Bạn có muốn đi xem phim không?")
    ]

    # Task 3 answers
    task3_answers = [
        ("feel valued", "Điều quan trọng là làm cho nhân viên cảm thấy được đánh giá cao."),
        ("potential customers", "Chúng tôi cần thu hút nhiều khách hàng tiềm năng hơn."),
        ("willingness", "Sự sẵn lòng giúp đỡ của cô ấy thật đáng ngưỡng mộ."),
        ("commitment", "Anh ấy thể hiện cam kết mạnh mẽ với công việc."),
        ("involved", "Tôi đã tham gia vào dự án này từ đầu."),
        ("give up", "Đừng bao giờ từ bỏ ước mơ của bạn."),
        ("getting back to", "Tôi mong được quay lại làm việc sau kỳ nghỉ.")
    ]

    # Apply answers
    tasks_data = [task1_answers, task2_answers, task3_answers]

    for task_idx, answers in enumerate(tasks_data):
        if task_idx < len(data['fillInTheBlanks']['tasks']):
            for q_idx, (answer, translation) in enumerate(answers):
                if q_idx < len(data['fillInTheBlanks']['tasks'][task_idx]['questions']):
                    data['fillInTheBlanks']['tasks'][task_idx]['questions'][q_idx]['answer'] = answer
                    data['fillInTheBlanks']['tasks'][task_idx]['questions'][q_idx]['translation'] = translation

    # Save back
    with open('public/lessons/json/unit3-listening.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("✓ Unit 3 completed")

def main():
    print("Filling in answers and translations...\n")
    fill_unit1_answers()
    fill_unit2_answers()
    fill_unit3_answers()
    print("\n✅ All units completed!")

if __name__ == "__main__":
    main()
