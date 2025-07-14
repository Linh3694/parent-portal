# Student Selector Hooks & Components

## Tổng quan

Bộ hook và component này được tạo ra để quản lý việc chọn học sinh một cách nhất quán trong toàn bộ ứng dụng.

## Hooks

### 1. useStudentSelector

Hook chính để quản lý việc chọn học sinh với đầy đủ tính năng.

```typescript
import { useStudentSelector } from '../hooks/useStudentSelector';

const MyComponent = () => {
    const {
        parent,
        students,
        activeIndex,
        activeStudent,
        studentAvatars,
        setActiveIndex,
        refreshStudents,
        loading
    } = useStudentSelector();

    // Sử dụng các giá trị này
    return (
        <View>
            <Text>{activeStudent?.name}</Text>
            <StudentSelector
                students={students}
                activeIndex={activeIndex}
                studentAvatars={studentAvatars}
                onStudentSelect={setActiveIndex}
            />
        </View>
    );
};
```

**Tính năng:**
- Tự động fetch dữ liệu parent và students từ AsyncStorage
- Quản lý activeIndex để chọn học sinh hiện tại
- Tự động fetch avatar cho tất cả học sinh
- Cung cấp loading state
- Có thể refresh dữ liệu

### 2. useSimpleStudentSelector

Hook đơn giản hơn cho các trường hợp chỉ cần chọn một học sinh.

```typescript
import { useSimpleStudentSelector } from '../hooks/useSimpleStudentSelector';

const MyComponent = () => {
    const {
        students,
        selectedStudent,
        setSelectedStudent,
        loading,
        refreshStudents
    } = useSimpleStudentSelector();

    return (
        <View>
            <StudentPicker
                students={students}
                selectedStudent={selectedStudent}
                studentAvatars={{}}
                onStudentSelect={setSelectedStudent}
            />
        </View>
    );
};
```

**Tính năng:**
- Tự động chọn học sinh đầu tiên làm mặc định
- Quản lý selectedStudent thay vì activeIndex
- Đơn giản hơn useStudentSelector

## Components

### 1. StudentSelector

Component để hiển thị danh sách avatar học sinh với khả năng chọn.

```typescript
import StudentSelector from '../components/StudentSelector';

<StudentSelector
    students={students}
    activeIndex={activeIndex}
    studentAvatars={studentAvatars}
    onStudentSelect={setActiveIndex}
    size={40} // Tùy chọn
    showActiveIndicator={true} // Tùy chọn
/>
```

**Props:**
- `students`: Danh sách học sinh
- `activeIndex`: Index của học sinh đang được chọn
- `studentAvatars`: Cache avatar của học sinh
- `onStudentSelect`: Callback khi chọn học sinh
- `size`: Kích thước avatar (mặc định: 40)
- `showActiveIndicator`: Hiển thị indicator cho học sinh đang chọn (mặc định: true)

### 2. StudentPicker

Component để chọn học sinh với giao diện card.

```typescript
import StudentPicker from '../components/StudentPicker';

<StudentPicker
    students={students}
    selectedStudent={selectedStudent}
    studentAvatars={studentAvatars}
    onStudentSelect={setSelectedStudent}
    size={50} // Tùy chọn
    showName={true} // Tùy chọn
    layout="horizontal" // Tùy chọn: "horizontal" | "vertical"
/>
```

**Props:**
- `students`: Danh sách học sinh
- `selectedStudent`: Học sinh đang được chọn
- `studentAvatars`: Cache avatar của học sinh
- `onStudentSelect`: Callback khi chọn học sinh
- `size`: Kích thước avatar (mặc định: 50)
- `showName`: Hiển thị tên học sinh (mặc định: true)
- `layout`: Layout hiển thị (mặc định: "horizontal")

## Cách sử dụng

### Trường hợp 1: Màn hình chính với nhiều học sinh
```typescript
// Sử dụng useStudentSelector + StudentSelector
const {
    students,
    activeIndex,
    activeStudent,
    studentAvatars,
    setActiveIndex
} = useStudentSelector();

<StudentSelector
    students={students}
    activeIndex={activeIndex}
    studentAvatars={studentAvatars}
    onStudentSelect={setActiveIndex}
/>
```

### Trường hợp 2: Form chọn học sinh
```typescript
// Sử dụng useSimpleStudentSelector + StudentPicker
const {
    students,
    selectedStudent,
    setSelectedStudent
} = useSimpleStudentSelector();

<StudentPicker
    students={students}
    selectedStudent={selectedStudent}
    studentAvatars={{}}
    onStudentSelect={setSelectedStudent}
    showName={true}
    layout="vertical"
/>
```

## Lưu ý

1. Cả hai hook đều tự động fetch dữ liệu từ AsyncStorage khi component mount
2. Avatar được cache để tránh fetch lại nhiều lần
3. Có fallback avatar nếu không load được ảnh từ server
4. Hook tự động xử lý loading state
5. Có thể refresh dữ liệu khi cần thiết 