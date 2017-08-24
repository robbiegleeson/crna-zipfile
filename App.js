import React from 'react'
import { Button, Image, StyleSheet, Text, View } from 'react-native'
import { FileSystem } from 'expo'
import JSZipUtils from 'jszip-utils'
import JSZip from 'jszip'

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {image: '', text: ''}
  }

  async downloadZipFile() {
    const localUri = `${FileSystem.documentDirectory}files.zip`
    console.log('zip uri', localUri)
    const remoteUrl = 'https://raw.githubusercontent.com/smoll/crna-zipfile/master/remote/files.zip'
    const {uri} = await FileSystem.downloadAsync(remoteUrl, localUri)
    console.log('Finished downloading to ', uri)

    const data = await new JSZip.external.Promise((resolve, reject) => {
      JSZipUtils.getBinaryContent(uri, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })

    const zip = await JSZip.loadAsync(data)
    zip.forEach(async (relativePath, file) => {
      console.log('file: ', file)
      console.log('relativePath: ', relativePath)

      if (relativePath.endsWith('jpeg')) {
        const base64 = await file.async('base64')
        const b64uri = `data:image/jpeg;base64,${base64}`
        console.log('Setting state.image to ', b64uri)
        this.setState({image: b64uri})
      } else {
        const content = await file.async('binarystring')
        console.log('content: ', content)

        const tmp = relativePath.split('.')
        const basename = tmp[0]
        const ext = tmp.slice(-1)[0]
        const unzipped = `${FileSystem.documentDirectory}${basename}-unzipped.${ext}`
        await FileSystem.writeAsStringAsync(unzipped, content)
        console.log('unzipped: ', unzipped)
        const text = await FileSystem.readAsStringAsync(unzipped)
        this.setState({text})
      }
    })
  }

  async downloadTextOnlyFile() {
    const localUri = `${FileSystem.documentDirectory}textonly.zip`
    console.log('zip uri', localUri)
    const remoteUrl = 'https://raw.githubusercontent.com/smoll/crna-zipfile/master/remote/textonly.zip'
    const {uri} = await FileSystem.downloadAsync(remoteUrl, localUri)
    console.log('Finished downloading to ', uri)

    const data = await new JSZip.external.Promise((resolve, reject) => {
      JSZipUtils.getBinaryContent(uri, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })

    const baseDir = `${FileSystem.documentDirectory}text-only`
    await FileSystem.makeDirectoryAsync(baseDir, {intermediates: true})
    console.log('Created base dir ', baseDir)

    const zip = await JSZip.loadAsync(data)
    zip.forEach(async (relativePath, file) => {
      console.log('file: ', file)
      console.log('relativePath: ', relativePath)

      const content = await file.async('string')
      console.log('content: ', content)

      const unzipped = `${baseDir}/${relativePath}`
      await FileSystem.writeAsStringAsync(unzipped, content)
      console.log('unzipped: ', unzipped)
    })

    const allFiles = await FileSystem.readDirectoryAsync(baseDir)
    alert(`all files: ${allFiles}`)
  }

  render() {
    const {image, text} = this.state
    return (
      <View style={styles.container}>
        <Text>Open up App.js to start working on your app!</Text>
        <Text>Changes you make will automatically reload.</Text>
        <Text>Shake your phone to open the developer menu.</Text>

        <Button
          onPress={this.downloadZipFile.bind(this)}
          title="Image + Text Zip"
          color="blue"
        />

        <Button
          onPress={this.downloadTextOnlyFile}
          title="Text Zip Only"
          color="purple"
        />

        {image ?
          <Image
            style={{width: 292, height: 172}}
            source={{uri: image}}
          /> :
          null
        }
        <Text>{text}</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
