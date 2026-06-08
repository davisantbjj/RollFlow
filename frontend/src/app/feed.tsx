import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';

export default function Feed() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Comunidade</Text>
      </View>
      
      <ScrollView style={styles.scroll}>
        <View style={styles.postInputCard}>
          <TextInput 
            style={styles.input} 
            placeholder="O que você aprendeu no treino hoje?"
            placeholderTextColor={Colors.muted}
            multiline
          />
          <TouchableOpacity style={styles.postBtn}>
            <Text style={styles.postBtnText}>Publicar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.feedCard}>
          <View style={styles.feedHeader}>
            <View style={styles.avatar}></View>
            <View>
              <Text style={styles.author}>Mestre André</Text>
              <Text style={styles.time}>Há 2 horas</Text>
            </View>
          </View>
          <Text style={styles.content}>
            Excelente treino hoje galera! Focamos em passagens de guarda e estabilização. 
            Não se esqueçam do seminário no próximo sábado! Oss 🥋
          </Text>
          <View style={styles.actions}>
            <Text style={styles.actionText}>🔥 12 Curtidas</Text>
            <Text style={styles.actionText}>💬 4 Comentários</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  scroll: { flex: 1, paddingHorizontal: 20 },
  header: { padding: 24, paddingTop: 40 },
  title: { fontSize: 32, color: Colors.text, fontWeight: 'bold' },
  postInputCard: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  input: {
    color: Colors.text,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  postBtn: {
    backgroundColor: Colors.gold,
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
  },
  postBtnText: { color: Colors.black, fontWeight: 'bold' },
  feedCard: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  feedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.border, marginRight: 12 },
  author: { fontSize: 16, color: Colors.text, fontWeight: 'bold' },
  time: { fontSize: 12, color: Colors.muted },
  content: { fontSize: 15, color: Colors.text, lineHeight: 22, marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  actionText: { color: Colors.muted, fontSize: 13, fontWeight: 'bold' }
});
