import { View, Text, StyleSheet, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { Award, Share2 } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface CertificateCardProps {
  courseTitle: string;
  studentName: string;
  issueDate: string;
  schoolName: string;
}

const { width } = Dimensions.get('window');

export const CertificateCard = ({ 
  courseTitle, 
  studentName, 
  issueDate, 
  schoolName
}: CertificateCardProps) => {
  const { C, isDark } = useTheme();

  return (
    <Animated.View 
      entering={FadeInUp.delay(200).duration(500)}
      style={[
        styles.container, 
        { 
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderColor: Colors.primary + '30',
          shadowColor: Colors.primary 
        }
      ]}
    >
      <View style={[styles.innerBorder, { borderColor: Colors.primary + '20' }]}>
        <View style={styles.content}>
          <View style={styles.badgeContainer}>
            <Award size={48} color={Colors.primary} fill={Colors.primary + '20'} />
          </View>
          
          <Text style={[styles.schoolName, { color: Colors.primary }]}>{schoolName.toUpperCase()}</Text>
          
          <Text style={[styles.mainTitle, { color: C.text }]}>CERTIFICATE</Text>
          <Text style={[styles.subTitle, { color: C.textMuted }]}>OF COMPLETION</Text>
          
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          
          <Text style={[styles.presentedTo, { color: C.textMuted }]}>THIS IS PRESENTED TO</Text>
          <Text style={[styles.studentName, { color: C.text }]}>{studentName}</Text>
          
          <Text style={[styles.forCompleting, { color: C.textMuted }]}>
            for successfully completing all requirements of the course
          </Text>
          <Text style={[styles.courseTitle, { color: Colors.primary }]}>{courseTitle}</Text>
          
          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <Text style={[styles.footerLabel, { color: C.textMuted }]}>DATE ISSUED</Text>
              <Text style={[styles.footerValue, { color: C.text }]}>{issueDate}</Text>
            </View>
            <View style={styles.footerItem}>
              <Text style={[styles.footerLabel, { color: C.textMuted }]}>CERTIFICATE ID</Text>
              <Text style={[styles.footerValue, { color: C.text }]}>EDU-{Math.random().toString(36).substring(7).toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={[styles.shareBtn, { backgroundColor: Colors.primary }]}>
        <Share2 size={20} color="white" />
        <Text style={styles.shareText}>Share Achievement</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    borderRadius: 24,
    borderWidth: 1,
    padding: 12,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 30,
  },
  innerBorder: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  badgeContainer: {
    marginBottom: 16,
  },
  schoolName: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 24,
  },
  divider: {
    width: 60,
    height: 3,
    borderRadius: 2,
    marginBottom: 24,
  },
  presentedTo: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  studentName: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 16,
    textAlign: 'center',
  },
  forCompleting: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 20,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 30,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerItem: {
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 12,
    gap: 8,
  },
  shareText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
});
