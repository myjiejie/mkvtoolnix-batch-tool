import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react';
import React, { Component, Fragment } from 'react';

import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox';
import Footer from 'components/footer/Footer';
import InputField from 'components/pages/main/InputField';
import { Label } from 'office-ui-fabric-react/lib/Label';
import LoadingScreen from 'components/pages/main/LoadingScreen';
import Notice from 'components/dialog/notice';
import PropTypes from 'prop-types';
import { getDirectory } from 'utils/services';
import { post } from 'utils/requests'
import styles from 'components/pages/main/assets/styles/MainPage.module.scss';

/**
 * @namespace MainPage
 * @description - Main page of the app where files are merged.
 *
 * @property {object} appState - Global app state.
 * @property {function} setAppState - Function to set global app state.
 * @property {object} settings - User defined, persistent settings.
 * @property {function} updateMultipleSettings - Function to update multiple user defined settings at once.
 * @property {function} updateSetting - Function to update a single setting at a time.
 *
 * @memberof Pages
 */
class MainPage extends Component {

  state ={
    loading: false,
    hideDialog: true,
    messageTitle: '',
    messageText: ''
  };

  // Generic method to update directories
  setDirectory = (type) =>
    getDirectory((directory) =>
      this.props.setAppState({ [type]: directory }));

  // Method to update the input directory
  setInput = () => this.setDirectory('input');

  // Method to update the output directory
  setOutput = () => this.setDirectory('output');

  onChangeModeToggle = (mode) => {
    const updateSetting = this.props.updateSetting;
    const isRemoveSubtitles = mode === 'remove';
    updateSetting('isRemoveSubtitles', isRemoveSubtitles);
  };

  // Method to update "Same as source" option for output
  onChangeSameAsSource = () => {
    const isSameAsSource = this.props.settings.isSameAsSource;
    const updateSetting = this.props.updateSetting;

    updateSetting('isSameAsSource', !isSameAsSource);
  };

  processBatch = () => {
    const { props: { appState, settings } } = this;
    const { input, output } = appState;

    // Start spinner
    this.setState({ loading: true }, () => {

      const requestBody = JSON.stringify({ input, output, settings });

      // Stop spinner on response and display message
      post(requestBody, 'process_batch',

        // Success callback
        (response) => {
          this.setState({
            loading: false,
            hideDialog: false,
            messageTitle: response.status,
            messageText: response.error || response.warning ||
              'Batch successfully processed without any errors or warnings.'
          });
        },

        // Error callback
        (error) => {

          // Log error
          console.error(error);

          this.setState({
            loading: false,
            hideDialog: false,
            messageTitle: 'Error',
            messageText: 'There was an error which prevented the batch from being processed.'
          });
        }

      );
    });

  };

  setHideDialog = (setting) => (
    this.setState({ hideDialog: setting })
  );

  render() {
    const {
      onChangeSameAsSource,
      onChangeModeToggle,
      processBatch,
      props: {
        appState: { input, output },
        settings: { isRemoveSubtitles, isSameAsSource }
      },
      setHideDialog,
      setInput,
      setOutput,
      state: {
        loading,
        hideDialog,
        messageText,
        messageTitle
      }
    } = this;


    // If same as source or not
    const isFooterDisabled = isSameAsSource
      ? !input
      : !input || !output;

    const sameAsSourceValue = isSameAsSource
      ? input ? input + String.raw`\*`
      : input : output;



    // If merge or remove subtitles
    const buttonIcon = isRemoveSubtitles
      ? 'FabricUnsyncFolder'
      : 'FabricSyncFolder';

    const buttonText = isRemoveSubtitles
      ? 'Remove'
      : 'Merge';

    const buttonTitle = isRemoveSubtitles
      ? 'Remove subtitles'
      : 'Merge subtitles';

    const MergeSettingButton = (props) => {
      return isRemoveSubtitles
        ? <DefaultButton { ...props } />
        : <PrimaryButton { ...props } />;
    };

    const RemoveSettingButton = (props) => {
      return isRemoveSubtitles
        ? <PrimaryButton { ...props } />
        : <DefaultButton { ...props } />;
    };

    return(
      <Fragment>
        { loading ? <LoadingScreen /> : null }
        <Notice
          hideDialog={ hideDialog }
          messageText={ messageText }
          messageTitle={ messageTitle }
          setHideDialog={ setHideDialog }
        />

        <section className={ styles.home }>
          <InputField
            label="Source directory"
            placeholder="Select source directory"
            setValue={ setInput }
            value={ input }
          />

          <InputField
            disabled={ isSameAsSource }
            label="Output directory"
            placeholder="Select output directory"
            setValue={ setOutput }
            value={ sameAsSourceValue }
          />

          <Checkbox
            checked={ isSameAsSource }
            className={ styles.checkbox }
            label="Output same as source"
            onChange={ onChangeSameAsSource }
            title="Use video source directories for output"
          />

          <div className={ styles['mode-settings'] } >
            <Label>Subtitle processing mode <i>({ `${buttonText.toLowerCase()} selected` })</i></Label>

            <div>
              <MergeSettingButton
                text="Merge"
                title="Merge subtitles"
                onClick={ () => onChangeModeToggle('merge') }
              />
              <RemoveSettingButton
                text="Remove"
                title="Remove subtitles"
                onClick={ () => onChangeModeToggle('remove') }
              />
            </div>
          </div>

          <Footer
            buttonIcon={ buttonIcon }
            buttonOnClick={ processBatch }
            buttonText={ buttonText }
            buttonTitle={ buttonTitle }
            disabled={ isFooterDisabled }
          />
        </section>
      </Fragment>
    );
  };

}


MainPage.propTypes = {
  appState: PropTypes.object.isRequired,
  setAppState: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired,
  updateMultipleSettings: PropTypes.func,
  updateSetting: PropTypes.func
};

export default MainPage;
