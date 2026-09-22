import Header from './Header'
import Main from './Main'
import { View, StyleSheet } from 'react-native'

const Content = () => {
  return (
    <View style={styles.container}>
      <Header />
      <Main />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default Content
