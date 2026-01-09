import React, { useState, useEffect } from "react";
import { SafeAreaView, Alert, ScrollView, Pressable } from "react-native";
import { VStack, HStack, Text, Card, Checkbox, CheckboxIndicator, CheckboxIcon, CheckIcon, Icon, Input, InputField, Textarea, TextareaInput, Modal,
    ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, ButtonText, Fab, FabIcon, Box, Center, Spinner, } from "@gluestack-ui/themed";
import { Plus, Trash2, X } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import { createTodo, updateTodo, deleteTodo, subscribeToTodos, getCurrentUser, onAuthStateChange} from "../../firebaseConfig";

const TodoList = () => {
    const router = useRouter();
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const loadUserId = async () => {
            const storedUserId = await AsyncStorage.getItem("userId");
            if (storedUserId) {
                setUserId(storedUserId);
            }
        };
        loadUserId();
    }, []);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChange(async (user) => {
            setCurrentUser(user);

            if (user) {
                setUserId(user.uid);
                await AsyncStorage.setItem("userId", user.uid);
            } else {
                const storedUserId = await AsyncStorage.getItem("userId");
                if (storedUserId) {
                    setUserId(storedUserId);
                } else {
                    setUserId(null);
                }
            }
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = subscribeToTodos((todosData, error) => {
            if (error) {
                console.error("Subscription error:", error);
                Alert.alert("Error", "Gagal memuat data");
                setLoading(false);
                return;
            }

            const formatted = todosData.map(todo => ({
                ...todo,
                createdAtFormatted: todo.createdAt?.toDate?.()
                    .toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
            }));

            setTodos(formatted);
            setLoading(false);
        }, userId);

        return () => {
            unsubscribe?.();
        };
    }, [userId]);

    const resetForm = () => {
        setEditId(null);
        setTitle("");
        setDescription("");
    };

    const openAdd = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEdit = (todo) => {
        setEditId(todo.id);
        setTitle(todo.title);
        setDescription(todo.description || "");
        setModalOpen(true);
    };

    const closeModal = () => {
        if (!saving) {
            resetForm();
            setModalOpen(false);
        }
    };

    const saveTodo = async () => {

        if (!title.trim()) {
            Alert.alert("Peringatan", "Judul tidak boleh kosong");
            return;
        }

        if (saving) {
            return;
        }

        const effectiveUserId = userId || await AsyncStorage.getItem("userId");

        if (!effectiveUserId) {
            Alert.alert("Error", "Anda harus login untuk menambah todo");
            router.push("/(auth)/login");
            return;
        }

        setSaving(true);

        const todoData = {
            title: title.trim(),
            description: description.trim()
        };

        try {
            const result = editId
                ? await updateTodo(editId, todoData)
                : await createTodo(todoData, effectiveUserId);

            if (result.success) {
                resetForm();
                setModalOpen(false);
            } else {
                console.log("Failed:", result.error);
                Alert.alert("Error", result.error || "Gagal menyimpan");
            }
        } catch (error) {
            console.log("Exception:", error);
            Alert.alert("Error", "Terjadi kesalahan");
        } finally {
            setSaving(false);
        }
    };

    const toggleTodo = async (id, currentCompleted) => {
        const result = await updateTodo(id, { completed: !currentCompleted });
        if (!result.success) {
            Alert.alert("Error", "Gagal mengubah status");
        }
    };

    const deleteTodoHandler = (id) => {
        Alert.alert(
            "Hapus Todo",
            "Yakin ingin menghapus?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: async () => {
                        const result = await deleteTodo(id);
                        if (!result.success) {
                            Alert.alert("Error", "Gagal menghapus");
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
                <Center flex={1}>
                    <VStack space="md" alignItems="center">
                        <Spinner size="large" color="$blue600" />
                        <Text color="$textLight600">Memuat todos...</Text>
                    </VStack>
                </Center>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
            <ScrollView style={{ flex: 1 }}>
                <VStack px="$4" mt="$4" mb="$24" space="md">
                    {todos.length === 0 ? (
                        <Center py="$16">
                            <VStack space="md" alignItems="center">
                                <Box p="$4" bg="$blue100" borderRadius="$full">
                                    <Icon as={Plus} size="xl" color="$blue600" />
                                </Box>
                                <Text fontSize="$lg" fontWeight="$medium" color="$textLight700">
                                    Belum ada todo
                                </Text>
                                <Text textAlign="center" color="$textLight600">
                                    Tekan tombol + untuk menambahkan
                                </Text>
                            </VStack>
                        </Center>
                    ) : (
                        todos.map((item) => (
                            <Card
                                key={item.id}
                                p="$4"
                                borderRadius="$xl"
                                bg={item.completed ? "$trueGray100" : "$blue50"}
                                borderWidth={1}
                                borderColor={item.completed ? "$trueGray300" : "$blue200"}
                            >
                                <HStack alignItems="flex-start" space="md">
                                    <Checkbox
                                        isChecked={item.completed}
                                        onChange={() => toggleTodo(item.id, item.completed)}
                                    >
                                        <CheckboxIndicator>
                                            <CheckboxIcon as={CheckIcon} />
                                        </CheckboxIndicator>
                                    </Checkbox>

                                    <Pressable flex={1} onPress={() => openEdit(item)}>
                                        <VStack space="xs">
                                            <Text
                                                fontWeight="$semibold"
                                                fontSize="$md"
                                                color={item.completed ? "$trueGray600" : "$textDark900"}
                                            >
                                                {item.title}
                                            </Text>

                                            {item.description && (
                                                <Text fontSize="$sm" color="$textLight600">
                                                    {item.description}
                                                </Text>
                                            )}

                                            {item.createdAtFormatted && (
                                                <Text fontSize="$xs" color="$trueGray500" mt="$2">
                                                    📅 {item.createdAtFormatted}
                                                </Text>
                                            )}
                                        </VStack>
                                    </Pressable>

                                    <Pressable onPress={() => deleteTodoHandler(item.id)}>
                                        <Icon as={Trash2} size="md" color="$trueGray500" />
                                    </Pressable>
                                </HStack>
                            </Card>
                        ))
                    )}
                </VStack>
            </ScrollView>

            <Fab
                placement="bottom right"
                size="lg"
                bg="$blue500"
                onPress={openAdd}
            >
                <FabIcon as={Plus} size="lg" color="$white" />
            </Fab>

            <Modal isOpen={modalOpen} onClose={closeModal} size="lg">
                <ModalBackdrop />
                <ModalContent mx="$4" borderRadius="$2xl">
                    <ModalHeader>
                        <HStack justifyContent="space-between" alignItems="center" w="$full">
                            <Text fontSize="$xl" fontWeight="$semibold">
                                {editId ? "Edit Todo" : "Tambah Todo"}
                            </Text>
                            <Pressable onPress={closeModal} disabled={saving}>
                                <Icon as={X} size="sm" color="$trueGray600" />
                            </Pressable>
                        </HStack>
                    </ModalHeader>

                    <ModalBody py="$6">
                        <VStack space="lg">
                            <VStack space="xs">
                                <Text fontSize="$sm" fontWeight="$medium">Judul *</Text>
                                <Input isDisabled={saving}>
                                    <InputField
                                        placeholder="Masukkan judul"
                                        value={title}
                                        onChangeText={setTitle}
                                    />
                                </Input>
                            </VStack>

                            <VStack space="xs">
                                <Text fontSize="$sm" fontWeight="$medium">Deskripsi</Text>
                                <Textarea isDisabled={saving}>
                                    <TextareaInput
                                        placeholder="Tambahkan deskripsi"
                                        value={description}
                                        onChangeText={setDescription}
                                    />
                                </Textarea>
                            </VStack>
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <HStack space="md" w="$full">
                            <Button
                                variant="outline"
                                flex={1}
                                onPress={closeModal}
                                isDisabled={saving}
                            >
                                <ButtonText>Batal</ButtonText>
                            </Button>

                            <Button
                                flex={1}
                                onPress={saveTodo}
                                isDisabled={!title.trim() || saving}
                            >
                                {saving ? (
                                    <HStack space="sm" alignItems="center">
                                        <Spinner size="small" color="$white" />
                                        <ButtonText>Menyimpan...</ButtonText>
                                    </HStack>
                                ) : (
                                    <ButtonText>{editId ? "Perbarui" : "Simpan"}</ButtonText>
                                )}
                            </Button>
                        </HStack>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </SafeAreaView>
    );
};

export default TodoList;