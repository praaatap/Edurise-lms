import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { ChevronDown, Check, Building2, Plus } from 'lucide-react-native';
import { useSchoolStore } from '@/features/school/store/schoolStore';

export const CampusSwitcher = () => {
  const { C } = useTheme();
  const { activeSchool } = useSchoolStore();
  const [isOpen, setIsOpen] = useState(false);

  // Mock list of campuses for a Parent Organization
  const campuses = [
    { id: '1', name: 'Downtown Campus', location: 'New York, NY' },
    { id: '2', name: 'Westside Branch', location: 'Los Angeles, CA' },
    { id: '3', name: 'International School', location: 'London, UK' },
  ];

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity 
        style={[styles.container, { backgroundColor: C.surface, borderColor: C.border }]}
        onPress={() => setIsOpen(true)}
      >
        <View style={[styles.iconContainer, { backgroundColor: Colors.primary + '15' }]}>
          <Building2 size={16} color={Colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.campusName, { color: C.text }]}>{activeSchool?.name || 'Main Campus'}</Text>
          <Text style={[styles.orgName, { color: C.textMuted }]}>Parent Org: Edurise Global</Text>
        </View>
        <ChevronDown size={18} color={C.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsOpen(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>Switch Campus</Text>
              <Text style={[styles.modalSubtitle, { color: C.textMuted }]}>Select which institution to manage</Text>
            </View>

            {campuses.map((campus) => (
              <TouchableOpacity 
                key={campus.id} 
                style={[
                  styles.campusOption, 
                  activeSchool?.name === campus.name && { backgroundColor: Colors.primary + '10' }
                ]}
                onPress={() => setIsOpen(false)}
              >
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionName, { color: C.text }]}>{campus.name}</Text>
                  <Text style={[styles.optionLoc, { color: C.textMuted }]}>{campus.location}</Text>
                </View>
                {activeSchool?.name === campus.name && <Check size={18} color={Colors.primary} />}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.addCampusBtn, { borderColor: Colors.primary }]}>
              <Plus size={18} color={Colors.primary} />
              <Text style={[styles.addCampusText, { color: Colors.primary }]}>Add New Campus</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 10,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  campusName: {
    fontSize: 14,
    fontWeight: '700',
  },
  orgName: {
    fontSize: 11,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  campusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 15,
    fontWeight: '700',
  },
  optionLoc: {
    fontSize: 12,
    marginTop: 2,
  },
  addCampusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 12,
    gap: 10,
  },
  addCampusText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
