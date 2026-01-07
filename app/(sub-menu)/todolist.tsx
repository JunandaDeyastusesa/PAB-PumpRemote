import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Pressable } from "react-native";
import {
    VStack,
    HStack,
    Text,
    Card,
    Checkbox,
    CheckboxIndicator,
    CheckboxIcon,
    CheckIcon,
    Icon,
    Input,
    InputField,
    Textarea,
    TextareaInput,
    Modal,
    ModalBackdrop,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    ButtonText,
    Fab,
    FabIcon,
    Box,
} from "@gluestack-ui/themed";
import { Plus, Trash2, X } from "lucide-react-native";

const TodoList = () => {
    const [todos, setTodos] = useState([
        {
            id: 1,
            title: "Cek Kelembapan Tanah",
            description: "Pastikan sensor aktif dan data masuk",
            completed: false,
        },
    ]);

    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    /* =====================
       HANDLERS
    ===================== */

    const openAdd = () => {
        setEditId(null);
        setTitle("");
        setDescription("");
        setModalOpen(true);
    };

    const openEdit = (todo) => {
        setEditId(todo.id);
        setTitle(todo.title);
        setDescription(todo.description);
        setModalOpen(true);
    };

    const saveTodo = () => {
        if (!title.trim()) return;

        if (editId) {
            setTodos((prev) =>
                prev.map((t) =>
                    t.id === editId
                        ? { ...t, title, description }
                        : t
                )
            );
        } else {
            setTodos((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    title,
                    description,
                    completed: false,
                },
            ]);
        }

        setModalOpen(false);
    };

    const toggleTodo = (id) => {
        setTodos((prev) =>
            prev.map((todo) =>
                todo.id === id
                    ? { ...todo, completed: !todo.completed }
                    : todo
            )
        );
    };

    const deleteTodo = (id) => {
        setTodos((prev) => prev.filter((t) => t.id !== id));
    };

    /* =====================
       RENDER
    ===================== */

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView>
                <VStack px="$4" mt="$4" mb="$24" space="md">
                    {todos.map((item) => (
                        <Card
                            key={item.id}
                            p="$4"
                            borderRadius="$xl"
                            bg={
                                item.completed
                                    ? "$trueGray200"
                                    : "$blue100"
                            }
                            opacity={item.completed ? 0.7 : 1}
                        >
                            <HStack alignItems="center" space="md">
                                {/* Checkbox */}
                                <Checkbox
                                    isChecked={item.completed}
                                    onChange={() =>
                                        toggleTodo(item.id)
                                    }
                                    sx={{
                                        _checked: {
                                            bg: "$trueGray500",
                                            borderColor:
                                                "$trueGray500",
                                        },
                                    }}
                                >
                                    <CheckboxIndicator>
                                        <CheckboxIcon
                                            as={CheckIcon}
                                            color="$white"
                                        />
                                    </CheckboxIndicator>
                                </Checkbox>

                                {/* Text */}
                                <Pressable
                                    flex={1}
                                    onPress={() =>
                                        openEdit(item)
                                    }
                                >
                                    <VStack space="xs">
                                        <Text
                                            fontWeight="$semibold"
                                            color={
                                                item.completed
                                                    ? "$textLight600"
                                                    : "$textDark900"
                                            }
                                        >
                                            {item.title}
                                        </Text>

                                        <Text
                                            fontSize="$sm"
                                            color="$textLight600"
                                        >
                                            {item.description}
                                        </Text>
                                    </VStack>
                                </Pressable>

                                {/* Delete */}
                                <Pressable
                                    onPress={() =>
                                        deleteTodo(item.id)
                                    }
                                    hitSlop={10}
                                >
                                    <Icon
                                        as={Trash2}
                                        size="lg"
                                        color="$error600"
                                    />
                                </Pressable>
                            </HStack>
                        </Card>
                    ))}
                </VStack>
            </ScrollView>

            {/* FAB */}
            <Fab placement="bottom right" size="xl" py="$4" px="$4" bg="$blue600" onPress={openAdd} >
                <FabIcon as={Plus} size="xl" />
            </Fab>

            {/* MODAL ADD / EDIT */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                size="lg"
            >
                <ModalBackdrop
                    bg="$black"
                />

                <ModalContent
                    mx="$4"
                    borderRadius="$2xl"
                    borderWidth={1}
                    borderColor="$trueGray200"
                    bg="$white"
                    shadowColor="$trueGray900"
                    shadowOffset={{ width: 0, height: 10 }}
                    shadowOpacity={0.15}
                    shadowRadius={25}
                    elevation={30}
                    overflow="hidden"
                    maxHeight="85%"
                >
                    {/* Header */}
                    <ModalHeader
                        pb="$4"
                        borderBottomWidth={1}
                        borderBottomColor="$trueGray100"
                        bg="$white"
                    >
                        <VStack space="xs" w="$full">
                            <HStack justifyContent="space-between" alignItems="center">
                                <Text
                                    fontSize="$xl"
                                    fontWeight="$semibold"
                                    color="$textDark900"
                                >
                                    {editId ? "Edit Todo" : "Tambah Todo"}
                                </Text>
                                <Pressable
                                    onPress={() => setModalOpen(false)}
                                    hitSlop={10}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderColor: "$trueGray200"
                                    }}
                                >
                                    <Icon
                                        as={X}
                                        size="sm"
                                        color="$trueGray600"
                                    />
                                </Pressable>
                            </HStack>
                            <Text
                                fontSize="$sm"
                                color="$trueGray500"
                                fontWeight="$normal"
                            >
                                {editId ? "Perbarui detail todo Anda" : "Tambahkan todo baru ke daftar"}
                            </Text>
                        </VStack>
                    </ModalHeader>

                    {/* Body dengan ScrollView jika konten terlalu panjang */}
                    <ModalBody py="$6" pt="$4">
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            nestedScrollEnabled={true}
                            style={{ maxHeight: 400 }}
                        >
                            <VStack space="lg" pb="$2">
                                {/* Input Judul */}
                                <VStack space="xs">
                                    <Text
                                        fontSize="$sm"
                                        fontWeight="$medium"
                                        color="$textDark700"
                                        pl="$1"
                                    >
                                        Judul Todo *
                                    </Text>
                                    <Input
                                        variant="outline"
                                        size="lg"
                                        borderWidth={1.5}
                                        borderColor="$trueGray300"
                                        borderRadius="$lg"
                                        _focus={{
                                            borderColor: "$blue500",
                                            borderWidth: 1.5,
                                            bg: "$blue50",
                                        }}
                                    >
                                        <InputField
                                            placeholder="Masukkan judul todo"
                                            value={title}
                                            onChangeText={setTitle}
                                            fontSize="$md"
                                            fontWeight="$normal"
                                            py="$3"
                                        />
                                    </Input>
                                </VStack>

                                {/* Textarea Deskripsi dengan border yang jelas */}
                                <VStack space="xs">
                                    <Text
                                        fontSize="$sm"
                                        fontWeight="$medium"
                                        color="$textDark700"
                                        pl="$1"
                                    >
                                        Deskripsi
                                    </Text>
                                    <Box
                                        borderWidth={1.5}
                                        borderColor="$trueGray300"
                                        borderRadius="$lg"
                                        _focus={{
                                            borderColor: "$blue500",
                                        }}
                                    >
                                        <Textarea
                                            size="lg"
                                            minHeight="$32"
                                            maxHeight="$48"
                                            borderWidth={0}
                                            _focus={{
                                                borderWidth: 0,
                                            }}
                                        >
                                            <TextareaInput
                                                placeholder="Tambahkan deskripsi (opsional)"
                                                value={description}
                                                onChangeText={setDescription}
                                                fontSize="$md"
                                                fontWeight="$normal"
                                                py="$3"
                                            />
                                        </Textarea>
                                    </Box>
                                </VStack>
                            </VStack>
                        </ScrollView>
                    </ModalBody>

                    {/* Footer dengan background solid */}
                    <ModalFooter
                        pt="$4"
                        pb="$6"
                        px="$6"
                        borderTopWidth={1}
                        borderTopColor="$trueGray100"
                        bg="$white"
                    >
                        <HStack space="md" w="$full">
                            <Button
                                variant="outline"
                                flex={1}
                                size="md"
                                onPress={() => setModalOpen(false)}
                                borderWidth={1.5}
                                borderColor="$trueGray300"
                                borderRadius="$lg"
                                _hover={{
                                    bg: "$trueGray50",
                                    borderColor: "$trueGray400"
                                }}
                                _pressed={{
                                    bg: "$trueGray100",
                                    borderColor: "$trueGray500"
                                }}
                            >
                                <ButtonText
                                    color="$trueGray700"
                                    fontWeight="$medium"
                                >
                                    Batal
                                </ButtonText>
                            </Button>

                            <Button
                                flex={1}
                                size="md"
                                onPress={saveTodo}
                                bg="$blue600"
                                borderRadius="$lg"
                                _hover={{
                                    bg: "$blue700",
                                    shadowColor: "$blue600",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 4,
                                    elevation: 6
                                }}
                                _pressed={{
                                    bg: "$blue800",
                                    transform: [{ scale: 0.98 }]
                                }}
                                isDisabled={!title.trim()}
                                sx={{
                                    _disabled: {
                                        bg: "$trueGray400",
                                        opacity: 0.7,
                                    }
                                }}
                            >
                                <ButtonText
                                    fontWeight="$semibold"
                                    color="$white"
                                >
                                    {editId ? "Perbarui" : "Simpan"}
                                </ButtonText>
                            </Button>
                        </HStack>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </SafeAreaView>
    );
};

export default TodoList;
