import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useSchoolStore } from '@/features/school/store/schoolStore';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { Palette, Check, RefreshCcw, Image as ImageIcon } from 'lucide-react-native';
import { Button } from '@/shared/components/ui/Button';

const BRAND_COLORS = [
  '#6366F1', // Indigo (Default)
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#000000', // Black
];

export const BrandingSettings = () => {
  const { activeSchool, updateSchool } = useSchoolStore();
  const { C } = useTheme();
  
  const [selectedColor, setSelectedColor] = useState(activeSchool?.branding?.primaryColor || Colors.primary);
  const [iconUrl, setIconUrl] = useState(activeSchool?.branding?.icon || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!activeSchool?._id) return;
    
    setLoading(true);
    try {
      await updateSchool(activeSchool._id, {
        branding: {
          ...activeSchool.branding,
          primaryColor: selectedColor,
          icon: iconUrl,
        }
      } as any);
      Alert.alert('Success', 'School branding updated successfully! ✨');
    } catch (error) {
      Alert.alert('Error', 'Failed to update branding');
    } finally {
      setLoading(false);
    }
  };

  const resetBranding = () => {
    setSelectedColor(Colors.primary);
    setIconUrl('');
  };

  return (
    <View style={[styles.container, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={styles.header}>
        <Palette size={20} color={Colors.primary} />
        <Text style={[styles.title, { color: C.text }]}>School Branding</Text>
      </View>

      <Text style={[styles.description, { color: C.textMuted }]}>
        Customize your school's visual identity. These colors will be visible to all students.
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: C.text }]}>Primary Brand Color</Text>
        <View style={styles.colorGrid}>
          {BRAND_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color, borderColor: selectedColor === color ? C.text : 'transparent' }
              ]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && <Check size={16} color="white" />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: C.text }]}>Web App Icon (Favicon)</Text>
        <View style={[styles.inputContainer, { backgroundColor: C.background, borderColor: C.border }]}>
          <ImageIcon size={20} color={C.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: C.text }]}
            placeholder="https://example.com/icon.png"
            placeholderTextColor={C.textMuted}
            value={iconUrl}
            onChangeText={setIconUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <View style={styles.previewContainer}>
        <Text style={[styles.sectionLabel, { color: C.text }]}>Live Preview</Text>
        <View style={[styles.previewCard, { borderColor: C.border }]}>
          <View style={[styles.previewHeader, { backgroundColor: selectedColor }]}>
            <Text style={styles.previewHeaderText}>Your School App</Text>
          </View>
          <View style={styles.previewBody}>
            <View style={[styles.previewLine, { width: '80%', backgroundColor: C.border }]} />
            <View style={[styles.previewLine, { width: '60%', backgroundColor: C.border }]} />
            <TouchableOpacity style={[styles.previewBtn, { backgroundColor: selectedColor }]}>
              <Text style={styles.previewBtnText}>Enroll Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Button 
          title="Save Changes" 
          onPress={handleSave} 
          isLoading={loading}
          style={{ flex: 1 }}
        />
        <TouchableOpacity style={[styles.resetBtn, { borderColor: C.border }]} onPress={resetBranding}>
          <RefreshCcw size={20} color={C.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  previewContainer: {
    marginBottom: 24,
  },
  previewCard: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewHeader: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  previewHeaderText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  previewBody: {
    padding: 16,
    gap: 8,
  },
  previewLine: {
    height: 8,
    borderRadius: 4,
  },
  previewBtn: {
    marginTop: 8,
    height: 32,
    width: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  resetBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
